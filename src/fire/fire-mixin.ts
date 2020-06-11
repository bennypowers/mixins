import type { Constructor, CustomElement } from "../lib/constructor";
import { dedupeMixin } from '@open-wc/dedupe-mixin'

/**
 * Mixin which adds `fire` method
 *
 * @param superclass the class to mix in to
 * @return  The mixed class
 */
export const FireMixin = dedupeMixin(
  function FireMixin<TBase extends Constructor<CustomElement>>(superclass: TBase) {
    class FireMixinElement extends superclass {
      /**
       * Fires a CustomEvent with an optional supplied detail.
       *
       * Fired events do not bubble and are not composed by default,
       * Pass an EventInit in the third argument to set `bubbles` or `composed`.
       *
       * @param  type   CustomEvent type
       * @param  detail detail value
       * @param  options options initializer
       */
      fire(type: string, detail?: any, init?: EventInit): boolean {
        const { bubbles = false, composed = false } = init ?? {}
        return this.dispatchEvent(new CustomEvent(type, { bubbles, composed, detail }));
      }
    };

    return FireMixinElement;
  });
