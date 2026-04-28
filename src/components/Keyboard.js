import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['DEL','Z','X','C','V','B','N','M','OK'],
];

// Rainbow key colours cycling per letter key
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
'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').forEach((c) => {
  letterColours[c] = RAINBOW[colourIndex++ % RAINBOW.length];
});

function KeyButton({ label, onPress, letterStatuses, keyWidth }) {
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

  const keyW = isSpecial ? keyWidth * 1.6 : keyWidth;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.key,
          {
            width:           keyW,
            backgroundColor: bgColor,
            opacity: status === 'absent' ? 0.65 : 1,
          },
        ]}
      >
        <Text style={[styles.keyText, isSpecial && styles.specialText]}>
          {label === 'DEL' ? '⌫' : label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Keyboard({ onKey, letterStatuses = {} }) {
  // 10 keys in widest row + margins
  const keyWidth = Math.floor((SCREEN_WIDTH - 24) / 10) - 4;

  return (
    <View style={styles.container}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((label) => (
            <KeyButton
              key={label}
              label={label}
              onPress={onKey}
              letterStatuses={letterStatuses}
              keyWidth={keyWidth}
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
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 3,
    gap: 4,
  },
  key: {
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  keyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  specialText: {
    fontSize: 13,
  },
});
