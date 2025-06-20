import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // adjust port if needed

export default function GameScreen() {
  const [gameState, setGameState] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Listen to game state updates
    socket.on('gameState', (state) => {
      setGameState(state);
    });

    // Load categories list from backend
    fetch('http://localhost:3001/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);

    return () => {
      socket.off('gameState');
    };
  }, []);

  if (!gameState) return <div>Loading...</div>;

  // Show loading video full screen
  if (gameState.gamePhase === 'loading') {
    return (
      <video
        style={{ width: '100vw', height: '100vh', objectFit: 'cover' }}
        src="/loading.mp4"
        autoPlay
        loop
        muted
      />
    );
  }

  // Show category select screen
  if (gameState.gamePhase === 'categorySelect') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#222', color: 'white',
      }}>
        <h1>Select a Category</h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => socket.emit('selectCategory', cat)}
              style={{
                fontSize: '2rem',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show questions screen
  if (gameState.gamePhase === 'playing' && gameState.currentQuestion) {
    const q = gameState.currentQuestion;
    return (
      <div style={{
        height: '100vh', background: '#000', color: 'white', padding: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <h1 style={{ fontSize: 32 }}>{q.question}</h1>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 24, width: '60%' }}>
          {q.answers.map((a, i) => (
            <li
              key={i}
              style={{
                background: a.revealed ? '#4caf50' : '#444',
                marginBottom: 10,
                fontSize: '1.8rem',
                padding: '10px 15px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                color: a.revealed ? 'white' : '#ccc',
              }}
            >
              <span>{a.revealed ? a.text : '???'}</span>
              <span>{a.revealed ? a.points : ''}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 30 }}>
          <p>Strikes: {'X'.repeat(gameState.strikes)}</p>
          <p>Round Score: {gameState.roundScore}</p>
          <p>Team A ({gameState.teams[0]}): {gameState.teamScores.teamA}</p>
          <p>Team B ({gameState.teams[1]}): {gameState.teamScores.teamB}</p>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === 'finished') {
    return (
      <div style={{ color: 'white', fontSize: 36, textAlign: 'center', marginTop: '30vh' }}>
        <h2>Game Over</h2>
        <p>Team A ({gameState.teams[0]}): {gameState.teamScores.teamA}</p>
        <p>Team B ({gameState.teams[1]}): {gameState.teamScores.teamB}</p>
      </div>
    );
  }

  return <div>Waiting for game...</div>;
}
