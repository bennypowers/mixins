import { curry } from "ramda";

export const propOr = curry(
  <O, T extends object>(or: O, propName: string, object: T): T[keyof T] | O =>
    (propName in object && object[propName] !== undefined) ? object[propName] : or
);