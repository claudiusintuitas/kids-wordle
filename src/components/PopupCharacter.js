import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// Characters shown for different events
const CHARACTERS = {
  correct:  ['😸', '🐱', '🐾', '✨', '🦉', '🐘'],
  wrong:    ['🙈', '🐒', '😅', '🦆', '🦖'],
  win:      ['🦄', '🌈', '⭐', '🎉', '🥳', '🦕'],
  surprise: ['🐸', '🦊', '🐼', '🐨', '🦁', '🐵', '🦖', '🦕', '🐘', '🦉'],
};

function SinglePop({ emoji, delay, x, style }) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -60, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.5, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.emoji,
        style,
        { left: x, opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function PopupCharacter({ type = 'surprise', visible, count = 3 }) {
  if (!visible) return null;

  const pool = CHARACTERS[type] || CHARACTERS.surprise;
  const pops = Array.from({ length: count }, (_, i) => ({
    key: i,
    emoji: pool[i % pool.length],
    delay: i * 120,
    x: 30 + i * 70 + (Math.random() * 20 - 10),
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {pops.map(p => (
        <SinglePop key={p.key} emoji={p.emoji} delay={p.delay} x={p.x} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    height: 120,
  },
  emoji: {
    position: 'absolute',
    fontSize: 36,
    bottom: 0,
  },
});
