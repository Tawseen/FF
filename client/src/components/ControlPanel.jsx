import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ControlPanel.css';

const socket = io('http://localhost:3001');

export default function ControlPanel() {
  const [gameState, setGameState] = useState({
    currentQuestion: null,
    teamScores: { teamA: 0, teamB: 0 },
    roundScore: 0,
    strikes: 0,
    gamePhase: 'setup'
  });

  const [gameWindow, setGameWindow] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    socket.on('gameState', (newGameState) => {
      setGameState(newGameState);
    });

    socket.on('closeGameWindow', () => {
      if (gameWindow && !gameWindow.closed) {
        gameWindow.close();
        setGameWindow(null);
      }
    });

    return () => {
      socket.off('gameState');
      socket.off('closeGameWindow');
    };
  }, [gameWindow]);

  const openGameScreen = () => {
    const win = window.open('/game', '_blank', 'width=1024,height=768');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setPopupBlocked(true);
    } else {
      setGameWindow(win);
      setPopupBlocked(false);
    }
  };

  const closeGameScreen = () => {
    if (gameWindow && !gameWindow.closed) {
      gameWindow.close();
      socket.emit('requestCloseGameWindow');
      setGameWindow(null);
    }
  };

  const revealAnswer = (index) => {
    socket.emit('revealAnswer', index);
  };

  const addStrike = () => {
    socket.emit('addStrike');
  };

  const awardPoints = (team) => {
    socket.emit('awardPoints', team);
  };

  const nextQuestion = () => {
    socket.emit('nextQuestion');
  };

  const resetGame = () => {
    socket.emit('resetGame');
  };

  if (gameState.gamePhase !== 'playing') {
    return (
      <div className="control-panel">
        <h2>Control Panel</h2>
        <p>Waiting for game to start...</p>
        <button onClick={resetGame} className="reset-btn">
          Reset Game
        </button>
        <button onClick={openGameScreen} className="popup-btn">
          Open Game Screen
        </button>
        {popupBlocked && <p className="error-text">⚠️ Popup blocked! Please allow popups and try again.</p>}
      </div>
    );
  }

  return (
    <div className="control-panel">
      <div className="control-header">
        <button onClick={openGameScreen} className="popup-btn">
          Open Game Screen
        </button>
        {gameWindow && !gameWindow.closed && (
          <button onClick={closeGameScreen} className="close-popup-btn">
            Close Game Screen
          </button>
        )}
      </div>

      <div className="control-section">
        <h3>Current Question</h3>
        {gameState.currentQuestion && (
          <div className="question-info">
            <p><strong>{gameState.currentQuestion.question}</strong></p>
            <div className="answer-controls">
              {gameState.currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => revealAnswer(index)}
                  disabled={answer.revealed}
                  className={`answer-btn ${answer.revealed ? 'revealed' : ''}`}
                >
                  {index + 1}. {answer.text} ({answer.points})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="control-section">
        <h3>Game Controls</h3>
        <div className="game-controls">
          <button onClick={addStrike} className="strike-btn">
            Add Strike ({gameState.strikes}/3)
          </button>

          <div className="score-controls">
            <h4>Award Points (Round Score: {gameState.roundScore})</h4>
            <button onClick={() => awardPoints('teamA')} className="award-btn team-a">
              Award to Team A
            </button>
            <button onClick={() => awardPoints('teamB')} className="award-btn team-b">
              Award to Team B
            </button>
          </div>

          <button onClick={nextQuestion} className="next-btn">
            Next Question
          </button>

          <button onClick={resetGame} className="reset-btn">
            Reset Game
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Current Scores</h3>
        <div className="score-display">
          <div>Team A: {gameState.teamScores.teamA}</div>
          <div>Team B: {gameState.teamScores.teamB}</div>
        </div>
      </div>
    </div>
  );
}
