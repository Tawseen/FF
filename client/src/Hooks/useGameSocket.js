import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export default function useGameSocket() {
  const [gameState, setGameState] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketIo = io('http://localhost:3001'); // your server URL
    setSocket(socketIo);

    socketIo.on('connect', () => {
      console.log('Connected to game server:', socketIo.id);
    });

    socketIo.on('state', (state) => {
      setGameState(state);
    });

    socketIo.on('disconnect', () => {
      console.log('Disconnected from game server');
    });

    return () => {
      socketIo.disconnect();
    };
  }, []);

  // Actions you can call to send commands to server
  const revealAnswer = useCallback(
    (index) => {
      if (socket) socket.emit('revealAnswer', index);
    },
    [socket]
  );

  const addStrike = useCallback(
    (team) => {
      if (socket) socket.emit('addStrike', team);
    },
    [socket]
  );

  const awardPoints = useCallback(
    (team, points) => {
      if (socket) socket.emit('awardPoints', { team, points });
    },
    [socket]
  );

  const setBoard = useCallback(
    (board) => {
      if (socket) socket.emit('setBoard', board);
    },
    [socket]
  );

  const nextRound = useCallback(() => {
    if (socket) socket.emit('nextRound');
  }, [socket]);

  return {
    gameState,
    revealAnswer,
    addStrike,
    awardPoints,
    setBoard,
    nextRound,
  };
}
