// Graceful sound wrapper — works when expo-av native module is available,
// silently skips sounds when it isn't.
let Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch (_) {}

const cache = {};
let enabled = true;

export async function loadSounds() {
  if (!Audio) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const files = {
      // UI / feedback
      bubble:   require('../../assets/sounds/bubble_pop.wav'),
      surprise: require('../../assets/sounds/surprise_pop.wav'),
      fanfare:  require('../../assets/sounds/win_fanfare.wav'),
      wrong:    require('../../assets/sounds/wrong_guess.wav'),
      correct:  require('../../assets/sounds/correct_letter.wav'),
      charm:    require('../../assets/sounds/submit_charm.wav'),
      // Real animals (downloaded from Wikimedia Commons)
      cat:      require('../../assets/sounds/cat_meow.wav'),
      cat2:     require('../../assets/sounds/cat_meow_2.wav'),
      monkey:   require('../../assets/sounds/monkey.wav'),
      monkey2:  require('../../assets/sounds/monkey_2.wav'),
      elephant: require('../../assets/sounds/elephant.wav'),
      owl:      require('../../assets/sounds/owl.wav'),
      // Synthesized (no recordings exist)
      dinosaur: require('../../assets/sounds/dinosaur.wav'),
    };
    await Promise.all(
      Object.entries(files).map(async ([key, src]) => {
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
        cache[key] = sound;
      })
    );
  } catch (_) {}
}

async function play(key) {
  if (!enabled || !cache[key]) return;
  try {
    await cache[key].setPositionAsync(0);
    await cache[key].playAsync();
  } catch (_) {}
}

const pickRandom = (keys) => keys[Math.floor(Math.random() * keys.length)];

// Direct-named events
export const playBubble   = () => play('bubble');
export const playSurprise = () => play('surprise');
export const playFanfare  = () => play('fanfare');
export const playWrong    = () => play('wrong');
export const playCorrect  = () => play('correct');
export const playCharm    = () => play('charm');

// Animal sounds — randomized for variety. The popup type maps to a sound family.
export const playMeow = () => play(pickRandom(['cat', 'cat2']));

// Random "cute critter" sound — used when surprise/correct popups appear.
// Mixes cats, monkeys, owl, elephant for fun variety.
export const playCritter = () => play(pickRandom([
  'cat', 'cat2', 'monkey', 'monkey2', 'owl', 'elephant', 'dinosaur',
]));

// Specific animal triggers (in case the game wants to play one specifically)
export const playMonkey   = () => play(pickRandom(['monkey', 'monkey2']));
export const playElephant = () => play('elephant');
export const playOwl      = () => play('owl');
export const playDinosaur = () => play('dinosaur');

export function setSoundEnabled(val) { enabled = val; }
export function isSoundEnabled() { return enabled; }
