import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

// Floating decoration emojis
const FLOATERS = ['⭐', '🌈', '🎈', '🍭', '🦋', '🌸', '🎀', '🍬'];

function FloatingEmoji({ emoji, startX, delay, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0.5, 1, 1, 0.5] });

  return (
    <Animated.Text
      style={{
        position:  'absolute',
        left:      startX,
        top:       Math.random() * 120 + 20,
        fontSize:  size,
        transform: [{ translateY }],
        opacity,
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

function ModeButton({ label, emoji, subtitle, color1, color2, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.0,  friction: 3, useNativeDriver: true }),
    ]).start(() => onPress());
  };

  return (
    <Animated.View style={[styles.modeButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <LinearGradient
          colors={[color1, color2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modeButton}
        >
          <Text style={styles.modeEmoji}>{emoji}</Text>
          <Text style={styles.modeLabel}>{label}</Text>
          <Text style={styles.modeSubtitle}>{subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ onStartGame }) {
  const titleScale   = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const catBounce    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title entrance
    Animated.parallel([
      Animated.spring(titleScale,   { toValue: 1.0, friction: 4, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1,   duration: 500, useNativeDriver: true }),
    ]).start();

    // Cat bounce loop
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(catBounce, { toValue: -12, duration: 700, useNativeDriver: true }),
        Animated.timing(catBounce, { toValue: 0,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <LinearGradient
      colors={['#FFB6C1', '#FFD6E7', '#E8D5FF', '#C8E6FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Floating decorations */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {FLOATERS.map((e, i) => (
            <FloatingEmoji
              key={i}
              emoji={e}
              startX={(i * (W / FLOATERS.length)) % W}
              delay={i * 350}
              size={i % 2 === 0 ? 22 : 28}
            />
          ))}
        </View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            { transform: [{ scale: titleScale }], opacity: titleOpacity },
          ]}
        >
          <Text style={styles.titleEmojis}>🌟✨🌟</Text>
          <Text style={styles.title}>Kids Wordle!</Text>
          <Text style={styles.titleEmojis}>🌟✨🌟</Text>
        </Animated.View>

        {/* Mascot */}
        <Animated.Text
          style={[styles.catEmoji, { transform: [{ translateY: catBounce }] }]}
        >
          🐱
        </Animated.Text>
        <Text style={styles.catMessage}>
          Hi! I'm Whiskers! Let's play! 🎮
        </Text>

        {/* Mode buttons */}
        <View style={styles.buttons}>
          <ModeButton
            label="3 Letters"
            emoji="🔤"
            subtitle="Easier · Great for starters!"
            color1="#FF9A9E"
            color2="#FAD0C4"
            onPress={() => onStartGame(3)}
          />
          <ModeButton
            label="4 Letters"
            emoji="🔠"
            subtitle="A bit harder · More fun!"
            color1="#A18CD1"
            color2="#FBC2EB"
            onPress={() => onStartGame(4)}
          />
        </View>

        {/* How to play */}
        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>How to play 👇</Text>
          <View style={styles.howToRow}>
            <Text style={styles.howToSquare}>🟩</Text>
            <Text style={styles.howToText}>Right letter, right spot!</Text>
          </View>
          <View style={styles.howToRow}>
            <Text style={styles.howToSquare}>🟨</Text>
            <Text style={styles.howToText}>Right letter, wrong spot!</Text>
          </View>
          <View style={styles.howToRow}>
            <Text style={styles.howToSquare}>⬜</Text>
            <Text style={styles.howToText}>Letter not in word</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 10 },

  titleContainer: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  titleEmojis:    { fontSize: 22, letterSpacing: 4 },
  title: {
    fontSize:   42,
    fontWeight: '900',
    color:      '#5A3E6B',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },

  catEmoji:   { fontSize: 80, marginTop: 4 },
  catMessage: {
    fontSize:   15,
    color:      '#5A3E6B',
    fontWeight: '700',
    marginTop:  4,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical:   6,
    borderRadius:     20,
  },

  buttons:         { width: '100%', paddingHorizontal: 20, gap: 12 },
  modeButtonWrapper: { width: '100%' },
  modeButton: {
    borderRadius:    20,
    padding:         18,
    alignItems:      'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.18,
    shadowRadius:    8,
    elevation:       6,
  },
  modeEmoji:    { fontSize: 40, marginBottom: 4 },
  modeLabel:    { fontSize: 28, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  modeSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 2 },

  howTo: {
    marginTop:        16,
    backgroundColor:  'rgba(255,255,255,0.65)',
    borderRadius:     16,
    paddingHorizontal: 20,
    paddingVertical:   12,
    width:            '90%',
  },
  howToTitle: { fontSize: 15, fontWeight: '800', color: '#5A3E6B', textAlign: 'center', marginBottom: 8 },
  howToRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  howToSquare:{ fontSize: 20, marginRight: 10 },
  howToText:  { fontSize: 13, color: '#5A3E6B', fontWeight: '600' },
});
