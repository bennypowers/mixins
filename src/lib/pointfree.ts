export const elem =
  <T>(xs: T[]) => (x: T): boolean =>
    Array.isArray(xs) ? xs.includes(x) : false;
