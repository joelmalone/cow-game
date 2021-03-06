/**
 * Randomize array in-place using Durstenfeld shuffle algorithm.
 * From https://stackoverflow.com/a/12646864/246901.
 */
export function shuffleArrayInPlace(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
