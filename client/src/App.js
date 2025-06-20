import React, { useEffect, useState } from 'react';
import GameScreen from './components/GameScreen';
import TeamSetup from './components/TeamSetup';
import ControlPanel from './components/ControlPanel';
import './App.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/questions')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setQuestions(data);
        setTimeout(() => setLoading(false), 3000); // show loading a bit longer
      })
      .catch((error) => {
        console.error('Error fetching questions:', error);
        setQuestions([
          {
            question: "Name something you find in a kitchen",
            answers: [
              { text: "Refrigerator", points: 35 },
              { text: "Stove", points: 28 },
              { text: "Sink", points: 22 },
              { text: "Microwave", points: 15 },
            ],
          },
        ]);
        setTimeout(() => setLoading(false), 3000);
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
          Your browser does not support the video tag.
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
