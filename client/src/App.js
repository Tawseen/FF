import React, { useEffect, useState, useRef } from "react";
import GameScreen from "./components/GameScreen";
import TeamSetup from "./components/TeamSetup";
import ControlPanel from "./components/ControlPanel";
import CategorySelect from "./components/CategorySelect";
import "./App.css";

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  const [screen, setScreen] = useState("teamSetup"); // "teamSetup" | "categorySelect" | "game"
  const [selectedCategory, setSelectedCategory] = useState(null);

  const loadingPopup = useRef(null);

  // Fetch questions from server
  useEffect(() => {
    fetch("http://localhost:3001/questions")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setQuestions(data);
        openLoadingPopup(); // open popup while loading
        setTimeout(() => {
          setLoading(false);
          closeLoadingPopup();
        }, 3000); // show loading a bit longer
      })
      .catch((error) => {
        console.error("Error fetching questions:", error);
        setQuestions([
          {
            category: "Sample",
            question: "Name something you find in a kitchen",
            answers: [
              { text: "Refrigerator", points: 35 },
              { text: "Stove", points: 28 },
              { text: "Sink", points: 22 },
              { text: "Microwave", points: 15 },
              { text: "Dishes", points: 12 },
              { text: "Food", points: 8 },
              { text: "Oven", points: 5 },
              { text: "Knife", points: 3 },
            ],
          },
        ]);
        openLoadingPopup();
        setTimeout(() => {
          setLoading(false);
          closeLoadingPopup();
        }, 3000);
      });

    // Cleanup on unmount: close popup if open
    return () => closeLoadingPopup();
  }, []);

  // Opens a new popup window for the loading video
  function openLoadingPopup() {
    if (loadingPopup.current && !loadingPopup.current.closed) return; // already open

    const w = window.screen.width * 0.8;
    const h = window.screen.height * 0.8;
    const left = window.screenX + (window.innerWidth - w) / 2;
    const top = window.screenY + (window.innerHeight - h) / 2;

    loadingPopup.current = window.open(
      "/loading.html",
      "loadingPopup",
      `width=${w},height=${h},left=${left},top=${top},resizable=no,scrollbars=no`
    );
  }

  function closeLoadingPopup() {
    if (loadingPopup.current && !loadingPopup.current.closed) {
      loadingPopup.current.close();
      loadingPopup.current = null;
    }
  }

  // Called when team names are submitted in TeamSetup
  function handleStartGame(teamNames) {
    setTeams(teamNames);
    setGameStarted(true);
    setScreen("categorySelect"); // move to category select screen
  }

  // Called when a category is selected
  function handleCategorySelect(category) {
    setSelectedCategory(category);
    setScreen("game");
  }

  // Extract unique categories from questions for buttons
  const categories = Array.from(
    new Set(questions.map((q) => q.category))
  ).filter(Boolean);

  if (loading) {
    // We show nothing in React while popup loading screen is visible
    return null;
  }

  return (
    <div className="App">
      {screen === "teamSetup" && <TeamSetup onStart={handleStartGame} />}

      {screen === "categorySelect" && (
        <CategorySelect categories={categories} onSelect={handleCategorySelect} />
      )}

      {screen === "game" && (
        <>
          <GameScreen
            teams={teams}
            questions={questions.filter((q) => q.category === selectedCategory)}
            category={selectedCategory}
          />
          <ControlPanel />
        </>
      )}
    </div>
  );
}
