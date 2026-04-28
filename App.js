import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  const [screen, setScreen]         = useState('home');
  const [wordLength, setWordLength]  = useState(3);
  const [gameKey, setGameKey]        = useState(0);   // incremented each new game to force remount

  const handleStart = useCallback((length) => {
    setWordLength(length);
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const handleGoHome = useCallback(() => {
    setScreen('home');
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      {screen === 'home' ? (
        <HomeScreen onStartGame={handleStart} />
      ) : (
        <GameScreen
          key={gameKey}
          wordLength={wordLength}
          onGoHome={handleGoHome}
        />
      )}
    </>
  );
}
