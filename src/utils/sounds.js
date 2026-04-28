// Graceful sound wrapper — works when expo-av native module is available,
// silently skips sounds when it isn't (patched APKs, simulators without native build).
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
      bubble:   require('../../assets/sounds/bubble_pop.wav'),
      meow:     require('../../assets/sounds/cat_meow.wav'),
      surprise: require('../../assets/sounds/surprise_pop.wav'),
      fanfare:  require('../../assets/sounds/win_fanfare.wav'),
      wrong:    require('../../assets/sounds/wrong_guess.wav'),
      correct:  require('../../assets/sounds/correct_letter.wav'),
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

export const playBubble   = () => play('bubble');
export const playMeow     = () => play('meow');
export const playSurprise = () => play('surprise');
export const playFanfare  = () => play('fanfare');
export const playWrong    = () => play('wrong');
export const playCorrect  = () => play('correct');

export function setSoundEnabled(val) { enabled = val; }
export function isSoundEnabled() { return enabled; }
