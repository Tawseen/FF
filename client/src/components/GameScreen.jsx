import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './GameScreen.css';  // Import your CSS here

const socket = io('http://localhost:3001');

export default function GameScreen({ teams, questions }) {
  const [gameState, setGameState] = useState({
    currentQuestion: null,
    teamScores: { teamA: 0, teamB: 0 },
    roundScore: 1,
    strikes: 0,
    gamePhase: 'setup',
  });

  useEffect(() => {
    socket.on('gameState', (newGameState) => {
      setGameState(newGameState);
    });

    return () => {
      socket.off('gameState');
    };
  }, []);

  useEffect(() => {
    if (teams.length === 2 && gameState.gamePhase === 'setup') {
      socket.emit('startGame', { teams, questions });
    }
  }, [teams, questions, gameState.gamePhase]);

  const renderAnswerBoard = () => {
    if (!gameState.currentQuestion) return null;

    return (
      <div className="answer-board">
        {gameState.currentQuestion.answers.map((answer, i) => (
          <div
            key={i}
            className={`answer-slot ${answer.revealed ? 'revealed' : 'hidden'}`}
            aria-hidden={!answer.revealed}
            aria-label={
              answer.revealed
                ? `Answer ${i + 1}: ${answer.text}, worth ${answer.points} points`
                : `Answer ${i + 1} hidden`
            }
          >
            <div className="answer-number">{i + 1}</div>
            <div className="answer-text">
              {answer.revealed ? answer.text.toUpperCase() : ''}
            </div>
            <div className="answer-points">
              {answer.revealed ? answer.points : ''}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStrikes = () => (
    <div className="strikes" aria-label={`Strikes: ${gameState.strikes}`}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`strike ${i < gameState.strikes ? 'active' : ''}`}>
          ❌
        </div>
      ))}
    </div>
  );

  if (gameState.gamePhase === 'finished') {
    const winner =
      gameState.teamScores.teamA > gameState.teamScores.teamB ? teams[0] : teams[1];
    return (
      <div className="game-screen game-finished" role="main">
        <h1>🎉 GAME OVER! 🎉</h1>
        <h2>Winner: {winner}</h2>
        <div className="final-scores">
          <div className="team-score">
            <h3>{teams[0]}</h3>
            <div className="score">{gameState.teamScores.teamA}</div>
          </div>
          <div className="team-score">
            <h3>{teams[1]}</h3>
            <div className="score">{gameState.teamScores.teamB}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen" role="main" aria-live="polite">
      <div className="scoreboard">
        <div className="team-score" aria-label={`${teams[0]} score`}>
          <h3>{teams[0]}</h3>
          <div className="score">{gameState.teamScores.teamA}</div>
        </div>
        <div className="round-info" aria-label={`Round ${gameState.roundScore}`}>
          <div className="round-score">Round: {gameState.roundScore}</div>
          {renderStrikes()}
        </div>
        <div className="team-score" aria-label={`${teams[1]} score`}>
          <h3>{teams[1]}</h3>
          <div className="score">{gameState.teamScores.teamB}</div>
        </div>
      </div>

      {gameState.currentQuestion && (
        <div className="question-section">
          <div
            className="question-text"
            aria-live="assertive"
            tabIndex={-1}
          >
            {gameState.currentQuestion.question}
          </div>
          {renderAnswerBoard()}
        </div>
      )}
    </div>
  );
}
