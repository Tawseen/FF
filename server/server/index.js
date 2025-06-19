const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { getQuestionsFromCSV } = require('./google-sheets-csv'); // your CSV helper

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());

let gameState = {
  teams: { A: 0, B: 0 },
  round: 1,
  board: [],
  revealed: [],
  strikes: { A: 0, B: 0 },
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('state', gameState);

  socket.on('revealAnswer', (index) => {
    gameState.revealed[index] = true;
    io.emit('state', gameState);
  });

  socket.on('addStrike', (team) => {
    gameState.strikes[team]++;
    io.emit('state', gameState);
  });

  socket.on('awardPoints', ({ team, points }) => {
    gameState.teams[team] += points;
    io.emit('state', gameState);
  });

  socket.on('setBoard', (board) => {
    gameState.board = board;
    gameState.revealed = Array(board.length).fill(false);
    gameState.strikes = { A: 0, B: 0 };
    io.emit('state', gameState);
  });

  socket.on('nextRound', () => {
    gameState.round++;
    gameState.board = [];
    gameState.revealed = [];
    gameState.strikes = { A: 0, B: 0 };
    io.emit('state', gameState);
  });
});

app.get('/questions', async (req, res) => {
  try {
    const questions = await getQuestionsFromCSV();
    res.json(questions);
  } catch (err) {
    console.error('Failed to load questions:', err);
    res.status(500).send('Error loading questions');
  }
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
