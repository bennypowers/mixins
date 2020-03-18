import type { Constructor, CustomElement } from "../lib/constructor";
import { dedupeMixin } from '@open-wc/dedupe-mixin'

/**
 * Mixin which adds `fire` method
 *
 * @param superclass the class to mix in to
 * @return  The mixed class
 */
export const FireMixin = dedupeMixin(function FireMixin<
   TBase extends Constructor<CustomElement>
>(superclass: TBase) {
  class FireMixinElement extends superclass {
    /**
     * Fires a CustomEvent with an optional supplied detail.
     *
     * Fired events do not bubble and are not composed. For composed events,
     * use `dispatchEvent`.
     *
     * @param  type   CustomEvent type
     * @param  detail detail value
     * @param  options options initializer
     */
    fire(type: string, detail: any | undefined, { bubbles = false, composed = false }: EventInit | undefined = {}): boolean {
      return this.dispatchEvent(new CustomEvent(type, { bubbles, composed, detail }));
    }
  };

  return FireMixinElement;
});
