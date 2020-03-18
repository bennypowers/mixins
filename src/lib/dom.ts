import or from 'crocks/logic/or';

export const matches = (selector: string) => (el: Element) =>
  el.matches(selector);

const isFocused = matches(':focus');

const isActive = matches(':active');

/** True when the element is focused or active */
export const isFocusedOrActive: (el: Element) => boolean =
  or(isFocused, isActive);
