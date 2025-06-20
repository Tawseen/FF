import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function ControlPanel() {
  const [teams, setTeams] = useState(['Team A', 'Team B']);
  const [gameState, setGameState] = useState(null);
  const [gameWindow, setGameWindow] = useState(null);

  useEffect(() => {
    socket.on('gameState', setGameState);
    return () => socket.off('gameState');
  }, []);

  function openGameWindow() {
    if (gameWindow && !gameWindow.closed) {
      gameWindow.focus();
      return;
    }
    const win = window.open('/game', 'gameWindow', 'width=1280,height=720');
    setGameWindow(win);
  }

  function startGame() {
    socket.emit('setupTeams', teams);
    socket.emit('beginLoading');
    setTimeout(() => {
      socket.emit('showCategorySelect');
    }, 5000); // Show loading for 5 seconds before category select
  }

  function revealAnswer(index) {
    socket.emit('revealAnswer', index);
  }

  function addStrike() {
    socket.emit('addStrike');
  }

  function awardPoints(team) {
    socket.emit('awardPoints', team);
  }

  function nextQuestion() {
    socket.emit('nextQuestion');
  }

  function resetGame() {
    socket.emit('resetGame');
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Control Panel</h2>
      <div>
        <label>Team A: </label>
        <input
          type="text"
          value={teams[0]}
          onChange={e => setTeams([e.target.value, teams[1]])}
        />
      </div>
      <div>
        <label>Team B: </label>
        <input
          type="text"
          value={teams[1]}
          onChange={e => setTeams([teams[0], e.target.value])}
        />
      </div>
      <button onClick={startGame}>Begin Game</button>
      <button onClick={openGameWindow}>Open Game Window</button>
      <button onClick={resetGame}>Reset Game</button>

      {gameState && gameState.gamePhase === 'playing' && (
        <>
          <h3>Current Question Controls</h3>
          <div>
            {gameState.currentQuestion.answers.map((_, i) => (
              <button key={i} onClick={() => revealAnswer(i)}>
                Reveal Answer {i + 1}
              </button>
            ))}
          </div>
          <div>
            <button onClick={addStrike}>Add Strike</button>
            <button onClick={() => awardPoints('teamA')}>Award Points to Team A</button>
            <button onClick={() => awardPoints('teamB')}>Award Points to Team B</button>
            <button onClick={nextQuestion}>Next Question</button>
          </div>
        </>
      )}
    </div>
  );
}
