// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const _ = require('lodash');

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

  const sampleQuestions = [
    {
      id: 1,
      question: "Name something you find in a kitchen",
      answers: [
        { text: "Refrigerator", points: 35, revealed: false },
        { text: "Stove", points: 28, revealed: false },
        { text: "Sink", points: 22, revealed: false },
        { text: "Microwave", points: 15, revealed: false },
        { text: "Dishes", points: 12, revealed: false },
        { text: "Food", points: 8, revealed: false }
      ]
    }
  ];

  function createInitialGameState() {
    return {
      currentQuestion: null,
      currentQuestionIndex: 0,
      teamScores: { teamA: 0, teamB: 0 },
      roundScore: 0,
      strikes: 0,
      gamePhase: 'setup',
      teams: ['', '']
    };
  }

  function cloneQuestion(question) {
    return _.cloneDeep(question);
  }

  let gameState = createInitialGameState();

  app.get('/questions', (req, res) => {
    const questionsForClient = sampleQuestions.map(q => ({
      id: q.id,
      question: q.question,
      answers: q.answers.map(a => ({
        text: a.text,
        points: a.points,
        revealed: false
      }))
    }));
    res.json(questionsForClient);
  });

  app.get('/game-state', (req, res) => {
    res.json(gameState);
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.emit('gameState', gameState);

    socket.on('startGame', (teams) => {
      if (!Array.isArray(teams) || teams.length !== 2) {
        socket.emit('error', 'Invalid teams array');
        return;
      }
      gameState = createInitialGameState();
      gameState.teams = teams;
      gameState.gamePhase = 'playing';
      gameState.currentQuestionIndex = 0;
      gameState.currentQuestion = cloneQuestion(sampleQuestions[0]);
      io.emit('gameState', gameState);
      console.log('Game started with teams:', teams);
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
      if (gameState.gamePhase !== 'playing') return;
      if (gameState.currentQuestionIndex < sampleQuestions.length - 1) {
        gameState.currentQuestionIndex++;
        gameState.currentQuestion = cloneQuestion(sampleQuestions[gameState.currentQuestionIndex]);
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

    socket.on('requestCloseGameWindow', () => {
      console.log('Request to close game window received from control panel');
      socket.broadcast.emit('closeGameWindow');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { startServer };
