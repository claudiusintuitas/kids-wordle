import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

const STATUS_COLORS = {
  empty:   { bg: '#FFFFFF', border: '#D0D0D0', text: '#333333' },
  filled:  { bg: '#FFFFFF', border: '#888888', text: '#333333' },
  correct: { bg: '#56CF6E', border: '#56CF6E', text: '#FFFFFF' },
  present: { bg: '#F7C948', border: '#F7C948', text: '#FFFFFF' },
  absent:  { bg: '#A0A0A0', border: '#A0A0A0', text: '#FFFFFF' },
};

export default function LetterTile({ letter, status, size, shouldReveal, revealDelay = 0 }) {
  // displayedStatus drives the color — changes mid-animation so the flip hides the switch
  const [displayedStatus, setDisplayedStatus] = useState(status);

  const squishAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  // Keep displayedStatus in sync with non-evaluated prop changes (empty ↔ filled)
  useEffect(() => {
    if (status === 'empty' || status === 'filled') {
      setDisplayedStatus(status);
    }
  }, [status]);

  // Pop animation when a letter is typed into this tile
  const prevLetterRef = useRef(letter);
  useEffect(() => {
    if (letter && letter !== prevLetterRef.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2,  duration: 70,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 60,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 60,  useNativeDriver: true }),
      ]).start();
    }
    prevLetterRef.current = letter;
  }, [letter]);

  // Squish-reveal animation when the tile is evaluated
  const hasRevealedRef = useRef(false);
  useEffect(() => {
    if (shouldReveal && !hasRevealedRef.current &&
        ['correct', 'present', 'absent'].includes(status)) {
      hasRevealedRef.current = true;
      const timer = setTimeout(() => {
        // Squish down
        Animated.timing(squishAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Swap color while tile is "invisible"
          setDisplayedStatus(status);
          // Unsquish
          Animated.timing(squishAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Cheerful bounce
            Animated.sequence([
              Animated.timing(scaleAnim, { toValue: 1.15, duration: 90,  useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 0.95, duration: 80,  useNativeDriver: true }),
              Animated.timing(scaleAnim, { toValue: 1.0,  duration: 70,  useNativeDriver: true }),
            ]).start();
          });
        });
      }, revealDelay);
      return () => clearTimeout(timer);
    }
  }, [shouldReveal, status, revealDelay]);

  const colors = STATUS_COLORS[displayedStatus] || STATUS_COLORS.empty;

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          width:           size,
          height:          size,
          backgroundColor: colors.bg,
          borderColor:     colors.border,
          transform: [
            { scaleY: squishAnim },
            { scale:  scaleAnim  },
          ],
        },
      ]}
    >
      <Text
        style={[
          styles.letter,
          { color: colors.text, fontSize: size * 0.46 },
        ]}
      >
        {letter ? letter.toUpperCase() : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  letter: {
    fontWeight: '900',
    includeFontPadding: false,
  },
});
