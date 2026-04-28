import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Alphabetical layout — 6 letters per row makes each bubble much bigger.
// 5 rows total: 4 rows of 6 + 1 row of 2 + DEL + OK.
const ROWS = [
  ['A','B','C','D','E','F'],
  ['G','H','I','J','K','L'],
  ['M','N','O','P','Q','R'],
  ['S','T','U','V','W','X'],
  ['DEL','Y','Z','OK'],
];

// Bubble colours — each letter gets a candy-bright hue.
// We pick a [base, light] pair so the bubble has a glossy gradient.
const BUBBLE_COLOURS = [
  ['#FF6B9D', '#FFB3CD'], // pink
  ['#FF8E53', '#FFC8A6'], // peach
  ['#FFCC00', '#FFE680'], // yellow
  ['#6BCB77', '#B5E3BB'], // mint
  ['#4FC3F7', '#A6E1FA'], // sky
  ['#A78BFA', '#D4C5FB'], // lavender
  ['#F472B6', '#FAB6D9'], // rose
  ['#34D399', '#9AE9C9'], // teal
  ['#60A5FA', '#B0CFFC'], // cornflower
  ['#FCA5A5', '#FFD1D1'], // coral
];

const STATUS_COLOURS = {
  correct: ['#56CF6E', '#A8E5B5'],
  present: ['#F7C948', '#FBE0A4'],
  absent:  ['#A0A0A0', '#D0D0D0'],
};

let colourIndex = 0;
const letterColours = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c) => {
  letterColours[c] = BUBBLE_COLOURS[colourIndex++ % BUBBLE_COLOURS.length];
});

function BubbleKey({ label, onPress, letterStatuses, keyWidth, keyHeight }) {
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Bubble-pop animation: balloon up briefly, then bounce back.
  // Pairs perfectly with the bubble_pop.wav sound effect.
  const handlePress = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.18, duration: 60, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 50, useNativeDriver: true }),
        Animated.spring(scaleAnim,  { toValue: 1.0,  friction: 4,  useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.55, duration: 60,  useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
      ]),
    ]).start();
    onPress(label);
  };

  const isSpecial = label === 'DEL' || label === 'OK';
  const status    = letterStatuses[label];

  // Pick a colour pair: status > special > rainbow
  let pair;
  if (status) {
    pair = STATUS_COLOURS[status];
  } else if (isSpecial) {
    pair = label === 'OK' ? ['#56CF6E', '#A8E5B5'] : ['#FF6B6B', '#FFB3B3'];
  } else {
    pair = letterColours[label] || ['#CCC', '#EEE'];
  }
  const [base, light] = pair;

  const isPill = isSpecial;
  const w      = isPill ? keyWidth * 1.5 : keyWidth;
  // For letter keys: equal width and height for a perfect circle bubble.
  const h      = isPill ? keyHeight : Math.min(keyHeight, w);
  const radius = isPill ? h / 2 : w / 2;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity:   opacityAnim,
        margin:    2,
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View
          style={[
            styles.bubble,
            {
              width:        w,
              height:       h,
              borderRadius: radius,
              backgroundColor: base,
            },
          ]}
        >
          {/* Glossy highlight — the top half is brighter */}
          <LinearGradient
            colors={[light, base + 'E6']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
          />
          {/* Tiny shine spot — pure-white blob in the upper-left */}
          <View
            style={[
              styles.shine,
              {
                width:  w * 0.28,
                height: h * 0.20,
                top:    h * 0.12,
                left:   w * 0.18,
                borderRadius: w * 0.18,
              },
            ]}
          />
          {/* Letter / special label */}
          <Text
            style={[
              styles.label,
              {
                fontSize: isSpecial ? Math.round(h * 0.30) : Math.round(h * 0.46),
                opacity: status === 'absent' ? 0.7 : 1,
              },
            ]}
          >
            {label === 'DEL' ? '⌫' : label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Keyboard({ onKey, letterStatuses = {} }) {
  const { width: W, height: H } = Dimensions.get('window');

  // Widest letter row has 6 keys. Bottom row is 2 letters + 2 special pills (1.5x each)
  // = 2 + 3 = 5 slots, narrower than 6 — letters dominate the width.
  const horizontalPadding = 8;
  const gap               = 4;
  const widestRowSlots    = 6;
  const widestRowKeys     = 6;
  const availableW        = W - horizontalPadding * 2 - gap * (widestRowKeys - 1);
  const keyWidth          = Math.floor(availableW / widestRowSlots);

  // Slightly smaller keyboard so the guess grid has more room.
  const targetKeyboardH = Math.min(H * 0.46, 600);
  const verticalGap     = 5;
  const rowCount        = 5;
  const keyHeight       = Math.min(
    Math.floor((targetKeyboardH - verticalGap * (rowCount + 1)) / rowCount),
    keyWidth,           // never taller than the width — keeps letter keys perfectly circular
    220,
  );

  return (
    <View style={styles.container}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={[styles.row, { gap, marginVertical: verticalGap / 2 }]}>
          {row.map((label) => (
            <BubbleKey
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
  bubble: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-12deg' }],
  },
  label: {
    fontWeight: '900',
    color: '#FFFFFF',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
