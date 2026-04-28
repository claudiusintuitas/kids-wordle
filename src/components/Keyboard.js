import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Alphabetical layout — 9 / 9 / 8+specials. The widest row has 9 letter keys.
const ROWS = [
  ['A','B','C','D','E','F','G','H','I'],
  ['J','K','L','M','N','O','P','Q','R'],
  ['DEL','S','T','U','V','W','X','Y','Z','OK'],
];

const RAINBOW = [
  '#FF6B9D', '#FF8E53', '#FFCC00', '#6BCB77',
  '#4FC3F7', '#A78BFA', '#F472B6', '#34D399',
  '#60A5FA', '#FCA5A5',
];

const STATUS_BG = {
  correct: '#56CF6E',
  present: '#F7C948',
  absent:  '#A0A0A0',
};

let colourIndex = 0;
const letterColours = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c) => {
  letterColours[c] = RAINBOW[colourIndex++ % RAINBOW.length];
});

function KeyButton({ label, onPress, letterStatuses, keyWidth, keyHeight }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.82, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.0,  friction: 4, useNativeDriver: true }),
    ]).start();
    onPress(label);
  };

  const isSpecial = label === 'DEL' || label === 'OK';
  const status    = letterStatuses[label];
  let bgColor;
  if (status) {
    bgColor = STATUS_BG[status] || '#888';
  } else if (isSpecial) {
    bgColor = label === 'OK' ? '#56CF6E' : '#FF6B6B';
  } else {
    bgColor = letterColours[label] || '#CCC';
  }

  const keyW = isSpecial ? keyWidth * 1.5 : keyWidth;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.key,
          {
            width:           keyW,
            height:          keyHeight,
            backgroundColor: bgColor,
            opacity: status === 'absent' ? 0.65 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.keyText,
            { fontSize: isSpecial ? Math.round(keyHeight * 0.32) : Math.round(keyHeight * 0.45) },
          ]}
        >
          {label === 'DEL' ? '⌫' : label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Keyboard({ onKey, letterStatuses = {} }) {
  const { width: W, height: H } = Dimensions.get('window');

  // Bottom row is widest: 8 letter keys + 2 specials (each 1.5x). Effective slots = 8 + 3 = 11.
  // The middle and top rows each have 9 letter keys (smaller — 9 < 11 so they're guaranteed to fit).
  const horizontalPadding = 8;
  const gap               = 4;
  const widestRowSlots    = 11; // 8 letters + 1.5 + 1.5
  const widestRowKeys     = 10; // 8 letters + DEL + OK = 10 actual keys, 9 gaps between them
  const availableW        = W - horizontalPadding * 2 - gap * (widestRowKeys - 1);
  const keyWidth          = Math.floor(availableW / widestRowSlots);

  // Use available vertical space — aim for ~38% of screen for keyboard, capped per-key
  const targetKeyboardH = Math.min(H * 0.42, 360);
  const verticalGap     = 6;
  const rowCount        = 3;
  const keyHeight       = Math.min(
    Math.floor((targetKeyboardH - verticalGap * (rowCount + 1)) / rowCount),
    Math.round(keyWidth * 1.3),  // never taller than 1.3x width — keeps proportions nice
    72                            // hard cap so it doesn't get silly on tablets
  );

  return (
    <View style={styles.container}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={[styles.row, { gap, marginVertical: verticalGap / 2 }]}>
          {row.map((label) => (
            <KeyButton
              key={label}
              label={label}
              onPress={onKey}
              letterStatuses={letterStatuses}
              keyWidth={keyWidth}
              keyHeight={keyHeight}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  key: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  keyText: {
    fontWeight: '800',
    color: '#FFFFFF',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
