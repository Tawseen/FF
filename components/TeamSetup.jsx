import React, { useState } from 'react';

export default function TeamSetup({ onStart }) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamA && teamB) {
      onStart([teamA, teamB]);
    }
  };

  return (
    <div className="setup-screen">
      <h2>Enter Team Names</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Team A"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
        />
        <input
          type="text"
          placeholder="Team B"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
        />
        <button type="submit">Start Game</button>
      </form>
    </div>
  );
}
