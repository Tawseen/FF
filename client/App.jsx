import React, { useEffect, useState } from 'react';
import GameScreen from './components/GameScreen';
import TeamSetup from './components/TeamSetup';
import ControlPanel from './components/ControlPanel';
import './index.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/questions')
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setTimeout(() => setLoading(false), 5000); // fake delay for loading screen
      });
  }, []);

  const handleStartGame = (teamNames) => {
    setTeams(teamNames);
    setGameStarted(true);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <video autoPlay muted loop className="video-bg">
          <source src="/loading.mp4" type="video/mp4" />
        </video>
        <h1 className="title">Taha Family Feud</h1>
      </div>
    );
  }

  return (
    <div className="App">
      {!gameStarted ? (
        <TeamSetup onStart={handleStartGame} />
      ) : (
        <>
          <GameScreen teams={teams} questions={questions} />
          <ControlPanel />
        </>
      )}
    </div>
  );
}
