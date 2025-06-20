const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const _ = require('lodash');
const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');

async function loadQuestionsFromCSV(csvUrl) {
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error('Failed to fetch CSV');
    const csvText = await res.text();

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    });

    // Convert CSV rows to questions format with 8 answers each
    // Assumes columns: Category, QuestionID, QuestionText, A1,P1, A2,P2 ... A8,P8
    const questionsByCategory = {};

    for (const record of records) {
      let answers = [];
      for (let i = 1; i <= 8; i++) {
        const answerText = record[`A${i}`];
        const points = parseInt(record[`P${i}`], 10) || 0;
        if (answerText) {
          answers.push({ text: answerText, points, revealed: false });
        }
      }

      const category = record.Category || 'Unknown';

      if (!questionsByCategory[category]) {
        questionsByCategory[category] = [];
      }

      questionsByCategory[category].push({
        id: record.QuestionID,
        question: record.QuestionText,
        answers,
      });
    }

    // Sort questions in each category by QuestionID (optional)
    for (const cat in questionsByCategory) {
      questionsByCategory[cat].sort((a, b) => a.id.localeCompare(b.id));
    }

    return questionsByCategory;

  } catch (err) {
    console.error('Error loading CSV:', err);
    return {};
  }
}

function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json());

  let questionsByCategory = {};

  function createInitialGameState() {
    return {
      gamePhase: 'loading', // loading, categorySelect, playing, finished
      teams: ['', ''],
      selectedCategory: null,
      currentQuestionIndex: 0,
      currentQuestion: null,
      roundScore: 0,
      strikes: 0,
      teamScores: { teamA: 0, teamB: 0 },
    };
  }

  let gameState = createInitialGameState();

  app.get('/categories', (req, res) => {
    res.json(Object.keys(questionsByCategory));
  });

  app.get('/game-state', (req, res) => {
    res.json(gameState);
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.emit('gameState', gameState);

    socket.on('setupTeams', (teams) => {
      if (!Array.isArray(teams) || teams.length !== 2) {
        socket.emit('error', 'Invalid teams array');
        return;
      }
      gameState.teams = teams;
      io.emit('gameState', gameState);
      console.log('Teams set:', teams);
    });

    socket.on('beginLoading', () => {
      gameState.gamePhase = 'loading';
      io.emit('gameState', gameState);
      console.log('Loading screen started');
    });

    socket.on('showCategorySelect', () => {
      gameState.gamePhase = 'categorySelect';
      io.emit('gameState', gameState);
      console.log('Category selection shown');
    });

    socket.on('selectCategory', (category) => {
      if (!questionsByCategory[category]) {
        socket.emit('error', 'Invalid category selected');
        return;
      }
      gameState.selectedCategory = category;
      gameState.currentQuestionIndex = 0;
      gameState.roundScore = 0;
      gameState.strikes = 0;
      gameState.teamScores = { teamA: 0, teamB: 0 };
      gameState.currentQuestion = _.cloneDeep(questionsByCategory[category][0]);
      gameState.gamePhase = 'playing';
      io.emit('gameState', gameState);
      console.log(`Category selected: ${category}`);
    });

    socket.on('revealAnswer', (answerIndex) => {
      if (
        gameState.gamePhase !== 'playing' ||
        !gameState.currentQuestion ||
        typeof answerIndex !== 'number' ||
        !gameState.currentQuestion.answers[answerIndex] ||
        gameState.currentQuestion.answers[answerIndex].revealed
      ) {
        return;
      }
      gameState.currentQuestion.answers[answerIndex].revealed = true;
      gameState.roundScore += gameState.currentQuestion.answers[answerIndex].points;
      io.emit('gameState', gameState);
      console.log('Answer revealed:', gameState.currentQuestion.answers[answerIndex].text);
    });

    socket.on('addStrike', () => {
      if (gameState.gamePhase !== 'playing') return;
      gameState.strikes = Math.min(gameState.strikes + 1, 3);
      io.emit('gameState', gameState);
      console.log('Strike added. Total strikes:', gameState.strikes);
    });

    socket.on('awardPoints', (team) => {
      if (
        gameState.gamePhase !== 'playing' ||
        !['teamA', 'teamB'].includes(team)
      ) return;

      gameState.teamScores[team] += gameState.roundScore;
      gameState.roundScore = 0;
      gameState.strikes = 0;
      io.emit('gameState', gameState);
      console.log(`Points awarded to ${team}. New score:`, gameState.teamScores[team]);
    });

    socket.on('nextQuestion', () => {
      if (gameState.gamePhase !== 'playing' || !gameState.selectedCategory) return;

      const questions = questionsByCategory[gameState.selectedCategory];
      if (gameState.currentQuestionIndex < questions.length - 1) {
        gameState.currentQuestionIndex++;
        gameState.currentQuestion = _.cloneDeep(questions[gameState.currentQuestionIndex]);
        gameState.roundScore = 0;
        gameState.strikes = 0;
        io.emit('gameState', gameState);
        console.log('Next question loaded:', gameState.currentQuestion.question);
      } else {
        gameState.gamePhase = 'finished';
        gameState.currentQuestion = null;
        io.emit('gameState', gameState);
        console.log('Game finished!');
      }
    });

    socket.on('resetGame', () => {
      gameState = createInitialGameState();
      io.emit('gameState', gameState);
      console.log('Game reset');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Load questions on server start
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPyh3wZXMXRivI7qwd3TL6dD5LQq5NLWjkfqNtCOKaM70Ptu8DUoGT8cnwxAceSq-mpTNb0nQaZBqb/pub?gid=883847407&single=true&output=csv';

  loadQuestionsFromCSV(CSV_URL).then((qByCat) => {
    if (Object.keys(qByCat).length === 0) {
      console.warn('No questions loaded, server will use fallback sample questions.');
      questionsByCategory = {
        "Sample": [
          {
            id: '1',
            question: "Name something you find in a kitchen",
            answers: [
              { text: "Refrigerator", points: 35, revealed: false },
              { text: "Stove", points: 28, revealed: false },
              { text: "Sink", points: 22, revealed: false },
              { text: "Microwave", points: 15, revealed: false },
              { text: "Dishes", points: 12, revealed: false },
              { text: "Food", points: 8, revealed: false },
              { text: "Cups", points: 5, revealed: false },
              { text: "Utensils", points: 3, revealed: false }
            ]
          }
        ]
      };
    } else {
      questionsByCategory = qByCat;
      console.log(`Loaded categories: ${Object.keys(questionsByCategory).join(', ')}`);
    }
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { startServer };
