import React from 'react';

export default function GameScreen({ teams, questions }) {
  return (
    <div className="game-screen">
      <h2 className="matchup-title">
        {teams[0]} VS {teams[1]}
      </h2>
      <div className="question-board">
        <h3>Let the game begin!</h3>
        <p>(Control Panel will be used to reveal questions and answers)</p>
      </div>
    </div>
  );
}
