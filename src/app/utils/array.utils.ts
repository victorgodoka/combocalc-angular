/**
 * Creates an array starting from the offset, defaulting at 0 and ending at the length
 */
export const range = (end: number, start: number = 0) =>
  Array.from({ length: end - start + 1 }, (_, i) => i + start);

/**
 * Merges two arrays together into a single array with tuples for each value of the previous arrays.
 */
export const merge = <T1, T2>(arr1: T1[], arr2: T2[]) =>
  Array.from(
    { length: Math.min(arr1.length, arr2.length) },
    (_, i) => [arr1[i], arr2[i]] as const
  );

/**
 * Adds two numbers together, used as a helper for .reduce() to total arrays
 */
export const toTotal = (accumulator: number, currentValue: number) =>
  accumulator + currentValue;
