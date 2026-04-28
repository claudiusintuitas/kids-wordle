import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const EXPRESSIONS = {
  idle:        '🐱',
  typing:      '🐱',
  happy:       '😸',
  correct:     '😺',
  wrong:       '🙀',
  win:         '😻',
  lose:        '😿',
  celebrating: '🎉',
};

const MESSAGES = {
  idle:        'Find the secret word! 🌟',
  typing:      'Keep going... 🖊️',
  happy:       'Great letter! Keep going! ✨',
  correct:     'You found one! Amazing! 🌈',
  wrong:       'Oops! Try again! 💪',
  win:         'YOU WIN! You are SO clever! 🏆',
  lose:        '',   // set dynamically with the word
  celebrating: 'HOORAY! Party time! 🎊',
};

export default function Mascot({ state = 'idle', lostWord = '' }) {
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
      // Big excited jump + spin
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.6, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1.0, friction: 5, useNativeDriver: true }),
        ]),
        Animated.timing(rotateAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start(() => {
        rotateAnim.setValue(0);
      });
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

  const emoji   = EXPRESSIONS[state] || EXPRESSIONS.idle;
  const message = state === 'lose'
    ? `The word was "${lostWord.toUpperCase()}"! Try again! 😊`
    : MESSAGES[state] || MESSAGES.idle;

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
      {/* Triangle pointing down toward character */}
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
