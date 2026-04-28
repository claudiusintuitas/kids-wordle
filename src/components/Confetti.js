import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const COLOURS = [
  '#FF6B9D', '#FF8E53', '#FFCC00', '#6BCB77',
  '#4FC3F7', '#A78BFA', '#FF4444', '#34D399',
  '#F472B6', '#FCA5A5', '#60A5FA', '#FBBF24',
];

const SHAPES = ['●', '★', '■', '▲', '♥'];

const COUNT = 35;

function makeParticle(i) {
  return {
    id:    i,
    x:     Math.random() * W,
    color: COLOURS[i % COLOURS.length],
    shape: SHAPES[i % SHAPES.length],
    size:  Math.random() * 10 + 8,
    speed: Math.random() * 1200 + 1400,
    delay: Math.random() * 600,
    driftX: (Math.random() - 0.5) * 120,
    spin:  Math.random() > 0.5 ? '360deg' : '-360deg',
    animY:   new Animated.Value(0),
    animX:   new Animated.Value(0),
    animRot: new Animated.Value(0),
    animOp:  new Animated.Value(1),
  };
}

export default function Confetti({ active }) {
  const particles = useRef(Array.from({ length: COUNT }, (_, i) => makeParticle(i))).current;
  const launched  = useRef(false);

  useEffect(() => {
    if (active && !launched.current) {
      launched.current = true;
      particles.forEach((p) => {
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.animY,   { toValue: H + 40, duration: p.speed, useNativeDriver: true }),
            Animated.timing(p.animX,   { toValue: p.driftX, duration: p.speed, useNativeDriver: true }),
            Animated.timing(p.animRot, { toValue: 4,      duration: p.speed, useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(p.speed * 0.6),
              Animated.timing(p.animOp, { toValue: 0, duration: p.speed * 0.4, useNativeDriver: true }),
            ]),
          ]),
        ]).start();
      });
    }

    if (!active) {
      launched.current = false;
      particles.forEach((p) => {
        p.animY.setValue(0);
        p.animX.setValue(0);
        p.animRot.setValue(0);
        p.animOp.setValue(1);
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => {
        const rotate = p.animRot.interpolate({
          inputRange:  [0, 4],
          outputRange: ['0deg', p.spin],
        });
        return (
          <Animated.Text
            key={p.id}
            style={{
              position:  'absolute',
              top:       -20,
              left:      p.x,
              fontSize:  p.size,
              color:     p.color,
              transform: [
                { translateY: p.animY },
                { translateX: p.animX },
                { rotate },
              ],
              opacity: p.animOp,
            }}
          >
            {p.shape}
          </Animated.Text>
        );
      })}
    </View>
  );
}
