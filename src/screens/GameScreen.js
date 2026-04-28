import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Mascot, { pickRandomMascot } from '../components/Mascot';
import LetterTile        from '../components/LetterTile';
import Keyboard          from '../components/Keyboard';
import Confetti          from '../components/Confetti';
import PopupCharacter    from '../components/PopupCharacter';
import { getRandomWord } from '../data/wordlists';
import { evaluateGuess, isWin, buildLetterStatuses } from '../utils/gameLogic';
import {
  playBubble, playMeow, playSurprise, playFanfare, playWrong, playCorrect, playCharm, playCritter,
  playMonkey, playElephant, playOwl, playDinosaur,
} from '../utils/sounds';

// Each mascot has a signature sound played on big moments (e.g. on win).
const MASCOT_SOUND = {
  cat:      playMeow,
  dog:      playCritter,    // no real dog bark fetched — random critter is cute
  monkey:   playMonkey,
  dinosaur: playDinosaur,
  fox:      playCritter,
  panda:    playCritter,
  bear:     playElephant,   // bears growl, elephant works as a placeholder
  frog:     playCritter,
  unicorn:  playCritter,
  penguin:  playOwl,
};

const MAX_GUESSES    = 8;
const REVEAL_DELAY   = 340;
const REVEAL_ANIM_MS = 400;

const { width: W, height: H } = Dimensions.get('window');

export default function GameScreen({ wordLength, onGoHome }) {
  const [targetWord]      = useState(() => getRandomWord(wordLength));
  // Pick a random mascot for this game — cat / dog / monkey / dino / fox / etc.
  const [mascot]          = useState(() => pickRandomMascot());
  const [guesses, setGuesses]         = useState([]);
  const [currentLetters, setCurrentLetters] = useState([]);
  const [gameStatus, setGameStatus]   = useState('playing');
  const [mascotState, setMascotState] = useState('idle');
  const [letterStatuses, setLetterStatuses] = useState({});
  const [revealingRow, setRevealingRow]     = useState(-1);
  const [isLocked, setIsLocked]       = useState(false);
  const [showConfetti, setShowConfetti]     = useState(false);
  const [popup, setPopup] = useState({ visible: false, type: 'surprise', key: 0 });

  const rowShakeAnims = useRef(
    Array.from({ length: MAX_GUESSES }, () => new Animated.Value(0))
  ).current;

  const currentRow = guesses.length;

  const tileMargin   = 3;
  const maxFromWidth = Math.floor((W - 32) / wordLength) - tileMargin * 2;
  // Keyboard now takes ~52% of screen — give grid the rest minus header/mascot.
  const approxGridH  = H * 0.32;
  const maxFromHeight = Math.floor((approxGridH - MAX_GUESSES * tileMargin * 2) / MAX_GUESSES);
  const tileSize = Math.min(wordLength === 3 ? 60 : 54, maxFromWidth, maxFromHeight);

  const showPopup = useCallback((type, count = 3) => {
    setPopup(p => ({ visible: true, type, count, key: p.key + 1 }));
    setTimeout(() => setPopup(p => ({ ...p, visible: false })), 1200);
  }, []);

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
        playWrong();
        setMascotState('wrong');
        setTimeout(() => setMascotState('idle'), 800);
        return;
      }

      const guessWord  = currentLetters.join('');
      const evaluation = evaluateGuess(guessWord, targetWord);
      const newGuess   = { letters: [...currentLetters], evaluations: evaluation };
      const newGuesses = [...guesses, newGuess];

      // Charm sound the moment they submit — before the row reveal animation
      playCharm();

      setIsLocked(true);
      setCurrentLetters([]);
      setGuesses(newGuesses);
      setRevealingRow(currentRow);

      const totalMs = (wordLength - 1) * REVEAL_DELAY + REVEAL_ANIM_MS + 120;
      setTimeout(() => {
        setLetterStatuses(buildLetterStatuses(newGuesses));
        setRevealingRow(-1);

        const hasCorrect  = evaluation.some(e => e === 'correct');
        const hasPresent  = evaluation.some(e => e === 'present');

        if (isWin(evaluation)) {
          setGameStatus('won');
          setMascotState('win');
          setShowConfetti(true);
          playFanfare();
          showPopup('win', 5);
          // Mascot's signature sound after a short delay for extra delight
          const signature = MASCOT_SOUND[mascot.name] || playMeow;
          setTimeout(() => signature(), 600);
          setIsLocked(true);
        } else if (newGuesses.length >= MAX_GUESSES) {
          setGameStatus('lost');
          setMascotState('lose');
          playWrong();
          setIsLocked(true);
        } else {
          if (hasCorrect) {
            playCorrect();
            // Random critter sound on top — cat, monkey, owl, elephant, dino, etc.
            setTimeout(() => playCritter(), 250);
            showPopup('correct', 3);
          } else if (hasPresent) {
            playSurprise();
            setTimeout(() => playCritter(), 250);
            showPopup('surprise', 2);
          } else {
            playWrong();
            showPopup('wrong', 2);
          }
          setMascotState('happy');
          setTimeout(() => setMascotState('idle'), 900);
          setIsLocked(false);
        }
      }, totalMs);
      return;
    }

    // Letter key — bubble pop + bounce
    if (currentLetters.length < wordLength) {
      playBubble();
      setCurrentLetters((prev) => [...prev, key.toLowerCase()]);
    }
  }, [
    isLocked, gameStatus, currentLetters, guesses,
    currentRow, wordLength, targetWord, shakeCurrentRow, showPopup,
  ]);

  const buildRowTiles = (rowIndex) => {
    if (rowIndex < guesses.length) {
      return guesses[rowIndex].letters.map((letter, j) => ({
        letter,
        status:       guesses[rowIndex].evaluations[j],
        shouldReveal: rowIndex === revealingRow,
        revealDelay:  j * REVEAL_DELAY,
      }));
    }
    if (rowIndex === currentRow && gameStatus === 'playing') {
      return Array.from({ length: wordLength }, (_, j) => ({
        letter:      currentLetters[j] || '',
        status:      currentLetters[j] ? 'filled' : 'empty',
        shouldReveal: false,
        revealDelay:  0,
      }));
    }
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
        <PopupCharacter key={popup.key} type={popup.type} visible={popup.visible} count={popup.count} />

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

        <Mascot mascot={mascot} state={mascotState} lostWord={gameStatus === 'lost' ? targetWord : ''} />

        {/* Letter grid */}
        <View style={styles.grid}>
          {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
            const tiles = buildRowTiles(rowIndex);
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

        {gameStatus !== 'playing' && (
          <ResultBanner
            won={gameStatus === 'won'}
            word={targetWord}
            guessCount={guesses.length}
            onPlayAgain={onGoHome}
          />
        )}

        {gameStatus === 'playing' && (
          <Keyboard onKey={handleKey} letterStatuses={letterStatuses} />
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
      style={[styles.resultCard, { transform: [{ scale: scaleAnim }], opacity: opacAnim }]}
    >
      <Text style={styles.resultEmoji}>{won ? '🏆🌟🏆' : '😿💙😿'}</Text>
      <Text style={styles.resultHeadline}>
        {won ? 'You got it! Amazing!' : 'The word was:'}
      </Text>
      {!won && <Text style={styles.resultWord}>{word.toUpperCase()}</Text>}
      {won && <Text style={styles.resultGuesses}>in {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}! 🎉</Text>}
      <TouchableOpacity onPress={onPlayAgain} activeOpacity={0.85}>
        <LinearGradient
          colors={won ? ['#56CF6E', '#27AE60'] : ['#A18CD1', '#FBC2EB']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.playAgainBtn}
        >
          <Text style={styles.playAgainText}>{won ? '🌟 Play Again!' : '💪 Try Again!'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  header: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4,
  },
  homeBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)' },
  homeBtnText: { fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#4A2E6B' },
  headerRight: { width: 44, alignItems: 'flex-end' },
  guessCount: {
    fontSize: 14, fontWeight: '700', color: '#4A2E6B',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  grid: { alignItems: 'center', marginVertical: 4 },
  row: { flexDirection: 'row' },
  resultCard: {
    width: '88%', backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24, paddingVertical: 20, paddingHorizontal: 24,
    alignItems: 'center', marginVertical: 8,
    shadowColor: '#4A2E6B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
    borderWidth: 2, borderColor: '#E8D5FF',
  },
  resultEmoji:    { fontSize: 44, marginBottom: 8 },
  resultHeadline: { fontSize: 22, fontWeight: '900', color: '#4A2E6B', textAlign: 'center', marginBottom: 4 },
  resultWord:     { fontSize: 36, fontWeight: '900', color: '#56CF6E', marginBottom: 12, letterSpacing: 6 },
  resultGuesses:  { fontSize: 16, fontWeight: '700', color: '#A18CD1', marginBottom: 12 },
  playAgainBtn: {
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  playAgainText: {
    fontSize: 22, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});
