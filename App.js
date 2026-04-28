import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import { loadSounds } from './src/utils/sounds';

export default function App() {
  const [screen, setScreen]         = useState('home');
  const [wordLength, setWordLength]  = useState(3);
  const [gameKey, setGameKey]        = useState(0);

  useEffect(() => {
    loadSounds().catch(() => {}); // load all sounds on startup; ignore errors
  }, []);

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
