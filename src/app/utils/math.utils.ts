/**
 * Factorial function. Computes the x!
 */
export const fact = (x: number) => {
    let result = 1;
    for (let i = 2; i <= x; i++) result *= i;
  
    return result;
  };
  
  /**
   * Computes the binomial coefficient (n, k) or ways to choose k elements from a set of n
   */
  export const binomial = (n: number, k: number) =>
    fact(n) / (fact(n - k) * fact(k));
  
  /**
   * Rounds to specified number of decimal places
   */
  export const round = (x: number | string) =>
    Number.parseFloat(`${x}`).toFixed(2);
  