import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Mascot    from '../components/Mascot';
import LetterTile from '../components/LetterTile';
import Keyboard  from '../components/Keyboard';
import Confetti  from '../components/Confetti';
import { getRandomWord }                     from '../data/wordlists';
import { evaluateGuess, isWin, buildLetterStatuses } from '../utils/gameLogic';

const MAX_GUESSES    = 6;
const REVEAL_DELAY   = 340;  // ms between each tile reveal
const REVEAL_ANIM_MS = 400;  // duration of one tile's squish+unsquish

const { width: W, height: H } = Dimensions.get('window');

export default function GameScreen({ wordLength, onGoHome }) {
  const [targetWord]      = useState(() => getRandomWord(wordLength));
  const [guesses, setGuesses]         = useState([]);   // [{letters, evaluations}]
  const [currentLetters, setCurrentLetters] = useState([]);
  const [gameStatus, setGameStatus]   = useState('playing'); // 'playing'|'won'|'lost'
  const [mascotState, setMascotState] = useState('idle');
  const [letterStatuses, setLetterStatuses] = useState({});
  const [revealingRow, setRevealingRow]     = useState(-1);
  const [isLocked, setIsLocked]       = useState(false);
  const [showConfetti, setShowConfetti]     = useState(false);

  // One shake Animated.Value per row
  const rowShakeAnims = useRef(
    Array.from({ length: MAX_GUESSES }, () => new Animated.Value(0))
  ).current;

  const currentRow = guesses.length;

  // Calculate tile size that fits both width and available vertical space
  const tileMargin   = 4;   // LetterTile style margin
  const maxFromWidth = Math.floor((W - 32) / wordLength) - tileMargin * 2;
  const approxGridH  = H * 0.38;
  const maxFromHeight = Math.floor((approxGridH - (MAX_GUESSES - 1) * tileMargin * 2) / MAX_GUESSES);
  const tileSize = Math.min(wordLength === 3 ? 68 : 60, maxFromWidth, maxFromHeight);

  const shakeCurrentRow = useCallback(() => {
    const shake = rowShakeAnims[currentRow];
    Animated.sequence([
      Animated.timing(shake, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue:  12, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue:  -9, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue:   9, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue:   0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [currentRow, rowShakeAnims]);

  const handleKey = useCallback((key) => {
    if (isLocked || gameStatus !== 'playing') return;

    if (key === 'DEL') {
      setCurrentLetters((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'OK') {
      if (currentLetters.length < wordLength) {
        shakeCurrentRow();
        setMascotState('wrong');
        setTimeout(() => setMascotState('idle'), 800);
        return;
      }

      const guessWord  = currentLetters.join('');
      const evaluation = evaluateGuess(guessWord, targetWord);
      const newGuess   = { letters: [...currentLetters], evaluations: evaluation };
      const newGuesses = [...guesses, newGuess];

      // Lock input, trigger reveal animation
      setIsLocked(true);
      setCurrentLetters([]);
      setGuesses(newGuesses);
      setRevealingRow(currentRow);

      // After all tiles finish revealing, update game state
      const totalMs = (wordLength - 1) * REVEAL_DELAY + REVEAL_ANIM_MS + 120;
      setTimeout(() => {
        setLetterStatuses(buildLetterStatuses(newGuesses));
        setRevealingRow(-1);

        if (isWin(evaluation)) {
          setGameStatus('won');
          setMascotState('win');
          setShowConfetti(true);
          setIsLocked(true);   // game over — keep locked
        } else if (newGuesses.length >= MAX_GUESSES) {
          setGameStatus('lost');
          setMascotState('lose');
          setIsLocked(true);
        } else {
          // Encourage the player
          setMascotState('happy');
          setTimeout(() => setMascotState('idle'), 900);
          setIsLocked(false);
        }
      }, totalMs);
      return;
    }

    // Regular letter key
    if (currentLetters.length < wordLength) {
      setCurrentLetters((prev) => [...prev, key.toLowerCase()]);
    }
  }, [
    isLocked, gameStatus, currentLetters, guesses,
    currentRow, wordLength, targetWord, shakeCurrentRow,
  ]);

  // Build per-tile props for a given row
  const buildRowTiles = (rowIndex) => {
    if (rowIndex < guesses.length) {
      // Completed row
      return guesses[rowIndex].letters.map((letter, j) => ({
        letter,
        status:       guesses[rowIndex].evaluations[j],
        shouldReveal: rowIndex === revealingRow,
        revealDelay:  j * REVEAL_DELAY,
      }));
    }
    if (rowIndex === currentRow && gameStatus === 'playing') {
      // Active row being typed
      return Array.from({ length: wordLength }, (_, j) => ({
        letter:      currentLetters[j] || '',
        status:      currentLetters[j] ? 'filled' : 'empty',
        shouldReveal: false,
        revealDelay:  0,
      }));
    }
    // Future / empty row
    return Array.from({ length: wordLength }, () => ({
      letter: '', status: 'empty', shouldReveal: false, revealDelay: 0,
    }));
  };

  return (
    <LinearGradient
      colors={['#E0EEFF', '#F3E0FF', '#E0FFF0', '#FFF5E0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <Confetti active={showConfetti} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoHome} style={styles.homeBtn}>
            <Text style={styles.homeBtnText}>🏠</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {wordLength === 3 ? '3️⃣' : '4️⃣'} Letter Word
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.guessCount}>
              {guesses.length}/{MAX_GUESSES}
            </Text>
          </View>
        </View>

        {/* Mascot + speech bubble */}
        <Mascot
          state={mascotState}
          lostWord={gameStatus === 'lost' ? targetWord : ''}
        />

        {/* Letter grid — 6 rows */}
        <View style={styles.grid}>
          {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
            const tiles = buildRowTiles(rowIndex);
            const isActiveRow = rowIndex === currentRow && gameStatus === 'playing';
            return (
              <Animated.View
                key={rowIndex}
                style={[
                  styles.row,
                  {
                    transform: [{ translateX: rowShakeAnims[rowIndex] }],
                    opacity: rowIndex > currentRow && gameStatus !== 'playing' ? 0.4 : 1,
                  },
                ]}
              >
                {tiles.map((tile, colIndex) => (
                  <LetterTile
                    key={`r${rowIndex}c${colIndex}`}
                    letter={tile.letter}
                    status={tile.status}
                    size={tileSize}
                    shouldReveal={tile.shouldReveal}
                    revealDelay={tile.revealDelay}
                  />
                ))}
              </Animated.View>
            );
          })}
        </View>

        {/* Result banner (shown after game ends) */}
        {gameStatus !== 'playing' && (
          <ResultBanner
            won={gameStatus === 'won'}
            word={targetWord}
            guessCount={guesses.length}
            onPlayAgain={onGoHome}
          />
        )}

        {/* Keyboard (hidden after game ends) */}
        {gameStatus === 'playing' && (
          <Keyboard
            onKey={handleKey}
            letterStatuses={letterStatuses}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function ResultBanner({ won, word, guessCount, onPlayAgain }) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.timing(opacAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.resultCard,
        { transform: [{ scale: scaleAnim }], opacity: opacAnim },
      ]}
    >
      <Text style={styles.resultEmoji}>
        {won ? '🏆🌟🏆' : '😿💙😿'}
      </Text>
      <Text style={styles.resultHeadline}>
        {won ? 'You got it! Amazing!' : `The word was:`}
      </Text>
      {!won && (
        <Text style={styles.resultWord}>{word.toUpperCase()}</Text>
      )}
      {won && (
        <Text style={styles.resultGuesses}>
          in {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}! 🎉
        </Text>
      )}
      <TouchableOpacity onPress={onPlayAgain} activeOpacity={0.85}>
        <LinearGradient
          colors={won ? ['#56CF6E', '#27AE60'] : ['#A18CD1', '#FBC2EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.playAgainBtn}
        >
          <Text style={styles.playAgainText}>
            {won ? '🌟 Play Again!' : '💪 Try Again!'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: 'center',
  },

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  homeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  homeBtnText: { fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4A2E6B',
  },
  headerRight: { width: 44, alignItems: 'flex-end' },
  guessCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A2E6B',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  grid: {
    alignItems: 'center',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
  },

  resultCard: {
    width: '88%',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#4A2E6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E8D5FF',
  },
  resultEmoji:    { fontSize: 44, marginBottom: 8 },
  resultHeadline: { fontSize: 22, fontWeight: '900', color: '#4A2E6B', textAlign: 'center', marginBottom: 4 },
  resultWord:     { fontSize: 36, fontWeight: '900', color: '#56CF6E', marginBottom: 12, letterSpacing: 6 },
  resultGuesses:  { fontSize: 16, fontWeight: '700', color: '#A18CD1', marginBottom: 12 },
  playAgainBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  playAgainText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
