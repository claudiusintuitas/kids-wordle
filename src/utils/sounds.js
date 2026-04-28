import { Audio } from 'expo-av';

const soundFiles = {
  bubble:  require('../../assets/sounds/bubble_pop.wav'),
  meow:    require('../../assets/sounds/cat_meow.wav'),
  surprise:require('../../assets/sounds/surprise_pop.wav'),
  fanfare: require('../../assets/sounds/win_fanfare.wav'),
  wrong:   require('../../assets/sounds/wrong_guess.wav'),
  correct: require('../../assets/sounds/correct_letter.wav'),
};

const cache = {};
let enabled = true;

export async function loadSounds() {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  await Promise.all(
    Object.entries(soundFiles).map(async ([key, src]) => {
      const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
      cache[key] = sound;
    })
  );
}

async function play(key) {
  if (!enabled) return;
  const sound = cache[key];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
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
