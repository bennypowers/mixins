import { curry } from 'ramda';

type Predicate<T> = (x: T) => boolean;

export const and =
  curry(<T>(p: Predicate<T>, q: Predicate<T>, x: T) => p(x) && q(x));

export const or =
  curry(<T>(p: Predicate<T>, q: Predicate<T>, x: T) => p(x) || q(x));

export const not =
  curry(<T>(p: Predicate<T>, x: T) => !p(x));