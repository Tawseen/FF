import React, { useState } from 'react';
import './TeamSetup.css';


export default function TeamSetup({ onStart }) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamA.trim() && teamB.trim()) {
      onStart([teamA.trim(), teamB.trim()]);
    }
  };

  return (
    <div className="team-setup">
      <h1>Enter Team Names</h1>
      <form onSubmit={handleSubmit} className="team-form">
        <input
          type="text"
          placeholder="Team A Name"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
        />
        <input
          type="text"
          placeholder="Team B Name"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
        />
        <button type="submit">Start Game</button>
      </form>
    </div>
  );
}
