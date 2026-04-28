import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// Each mascot is a family of expressions across game states.
// Many emoji families don't have full expression sets — we fall back to a generic expression
// (the base face + an extra emoji decoration) where there's no purpose-built variant.
const MASCOTS = [
  {
    name: 'cat',
    base: '🐱',
    expressions: {
      idle:  '🐱',  typing: '🐱',  happy: '😸',
      correct: '😺', wrong: '🙀',  win: '😻', lose: '😿',
    },
  },
  {
    name: 'dog',
    base: '🐶',
    expressions: {
      idle: '🐶', typing: '🐶', happy: '🐶',
      correct: '🐕', wrong: '😖', win: '🦴', lose: '🥺',
    },
  },
  {
    name: 'monkey',
    base: '🐵',
    expressions: {
      idle: '🐵', typing: '🐵', happy: '🙊',
      correct: '🙉', wrong: '🙈', win: '🐒', lose: '🙈',
    },
  },
  {
    name: 'dinosaur',
    base: '🦖',
    expressions: {
      idle: '🦖', typing: '🦖', happy: '🦕',
      correct: '🦕', wrong: '😵', win: '🐉', lose: '🦴',
    },
  },
  {
    name: 'fox',
    base: '🦊',
    expressions: {
      idle: '🦊', typing: '🦊', happy: '🦊',
      correct: '🐾', wrong: '😅', win: '✨', lose: '😔',
    },
  },
  {
    name: 'panda',
    base: '🐼',
    expressions: {
      idle: '🐼', typing: '🐼', happy: '🐼',
      correct: '🎋', wrong: '😯', win: '🌟', lose: '😢',
    },
  },
  {
    name: 'bear',
    base: '🐻',
    expressions: {
      idle: '🐻', typing: '🐻', happy: '🐻',
      correct: '🍯', wrong: '😖', win: '🎉', lose: '🥺',
    },
  },
  {
    name: 'frog',
    base: '🐸',
    expressions: {
      idle: '🐸', typing: '🐸', happy: '🐸',
      correct: '🪰', wrong: '😬', win: '👑', lose: '😞',
    },
  },
  {
    name: 'unicorn',
    base: '🦄',
    expressions: {
      idle: '🦄', typing: '🦄', happy: '🦄',
      correct: '🌈', wrong: '😯', win: '✨', lose: '💔',
    },
  },
  {
    name: 'penguin',
    base: '🐧',
    expressions: {
      idle: '🐧', typing: '🐧', happy: '🐧',
      correct: '🐟', wrong: '😖', win: '🧊', lose: '😢',
    },
  },
];

// Friendly per-mascot intro line — just a touch of personality.
const INTROS = {
  cat:      'Find the secret word, friend! 🌟',
  dog:      'Woof! Let\'s find that word! 🐾',
  monkey:   'Oo-oo-ah-ah! Word time! 🍌',
  dinosaur: 'Stomp stomp! Find the word! 🦖',
  fox:      'Foxy time — what\'s the word? ✨',
  panda:    'Bamboo and words! Let\'s go! 🎋',
  bear:     'Beary good guess incoming! 🐻',
  frog:     'Ribbit! Hop to the secret word! 🐸',
  unicorn:  'Sparkle into the secret word! 🌈',
  penguin:  'Slide right into the word! 🧊',
};

const GENERIC_MESSAGES = {
  typing:      'Keep going... 🖊️',
  happy:       'Great letter! Keep going! ✨',
  correct:     'You found one! Amazing! 🌈',
  wrong:       'Oops! Try again! 💪',
  win:         'YOU WIN! You are SO clever! 🏆',
  celebrating: 'HOORAY! Party time! 🎊',
};

// Pick a random mascot at module-load time AND every time we want a new game.
// We export a function so GameScreen can ask for a fresh one per round.
let currentMascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
export function pickRandomMascot() {
  currentMascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
  return currentMascot;
}
export function getCurrentMascot() {
  return currentMascot;
}

export default function Mascot({ state = 'idle', lostWord = '', mascot }) {
  const m = mascot || currentMascot;
  const bounceY    = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceLoop = useRef(null);

  // Continuous idle bounce
  useEffect(() => {
    bounceLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -10, duration: 650, useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 0,   duration: 650, useNativeDriver: true }),
      ])
    );
    bounceLoop.current.start();
    return () => bounceLoop.current && bounceLoop.current.stop();
  }, []);

  // React to state changes with extra animation
  useEffect(() => {
    if (state === 'win' || state === 'celebrating') {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.6, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1.0, friction: 5, useNativeDriver: true }),
        ]),
        Animated.timing(rotateAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start(() => rotateAnim.setValue(0));
    } else if (state === 'correct' || state === 'happy') {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.35, friction: 3, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.0,  friction: 5, useNativeDriver: true }),
      ]).start();
    } else if (state === 'wrong' || state === 'lose') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.0, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const emoji = m.expressions[state] || m.expressions.idle || m.base;

  let message;
  if (state === 'lose') {
    message = `The word was "${lostWord.toUpperCase()}"! Try again! 😊`;
  } else if (state === 'idle') {
    message = INTROS[m.name] || 'Find the secret word! 🌟';
  } else {
    message = GENERIC_MESSAGES[state] || INTROS[m.name];
  }

  const spin = rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <SpeechBubble message={message} />
      <Animated.Text
        style={[
          styles.emoji,
          {
            transform: [
              { translateY: bounceY },
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        {emoji}
      </Animated.Text>
    </View>
  );
}

function SpeechBubble({ message }) {
  return (
    <View style={styles.bubbleWrapper}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{message}</Text>
      </View>
      <View style={styles.bubbleTail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  bubbleWrapper: {
    alignItems: 'center',
    marginBottom: 2,
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: 290,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFD6E7',
  },
  bubbleText: {
    fontSize: 13,
    color: '#5A3E6B',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
  emoji: {
    fontSize: 70,
    marginTop: 4,
  },
});
