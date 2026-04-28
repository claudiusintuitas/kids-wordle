/**
 * Evaluates a guess against the target word.
 * Returns an array of statuses: 'correct' | 'present' | 'absent'
 *
 * Uses two-pass approach to correctly handle duplicate letters:
 * - Pass 1: mark exact matches as 'correct'
 * - Pass 2: mark letters in wrong position as 'present'
 */
export function evaluateGuess(guess, target) {
  const result = Array(guess.length).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');

  // Pass 1: exact matches
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      targetArr[i] = null;
      guessArr[i] = null;
    }
  }

  // Pass 2: present in word but wrong position
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] !== null) {
      const idx = targetArr.indexOf(guessArr[i]);
      if (idx !== -1) {
        result[i] = 'present';
        targetArr[idx] = null;
      }
    }
  }

  return result;
}

export function isWin(evaluation) {
  return evaluation.every((s) => s === 'correct');
}

// Returns best known status for each letter used so far
// Priority: correct > present > absent
export function buildLetterStatuses(guesses) {
  const PRIORITY = { correct: 3, present: 2, absent: 1 };
  const statuses = {};
  for (const { letters, evaluations } of guesses) {
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i].toUpperCase();
      const status = evaluations[i];
      if (!statuses[letter] || PRIORITY[status] > PRIORITY[statuses[letter]]) {
        statuses[letter] = status;
      }
    }
  }
  return statuses;
}
