import { FireMixin } from '../fire';
import { expect, fixture, oneEvent } from '@open-wc/testing';

class XFire extends FireMixin(HTMLElement) {}

customElements.define('x-fire', XFire);

  declare global {
    interface HTMLElementTagNameMap {
      'x-fire': XFire
    }
  }

describe('FireMixin', function() {
  it('provides fire method', async function() {
    const el = await fixture<XFire>(`<x-fire></x-fire>`);
    expect(el.fire).to.be.an.instanceof(Function);
  });

  describe('FireMixinElement#fire', function() {
    it('fires an event with type', async function() {
      const el = await fixture<XFire>(`<x-fire></x-fire>`);
      const type = 'foo';
      setTimeout(() => el.fire(type));
      const event = await oneEvent(el, type);
      expect(event.type).to.equal(type);
    });

    it('fires an event with detail', async function() {
      const el = await fixture<XFire>(`<x-fire></x-fire>`);
      const type = 'foo';
      setTimeout(() => el.fire('foo', 2));
      const { detail } = await oneEvent(el, type);
      expect(detail).to.equal(2);
    });

    it('fires an event that by default does not bubble and is not composed', async function() {
      const el = await fixture<XFire>(`<x-fire></x-fire>`);
      const type = 'foo';
      setTimeout(() => el.fire('foo', 2));
      const { bubbles, composed } = await oneEvent(el, type);
      expect(bubbles).to.be.false;
      expect(composed).to.be.false;
    });

    it('fires a bubbling event', async function() {
      const el = await fixture<XFire>(`<x-fire></x-fire>`);
      const type = 'foo';
      setTimeout(() => el.fire('foo', 2, { bubbles: true }));
      const { bubbles } = await oneEvent(el, type);
      expect(bubbles).to.be.true;
    });

    it('fires a composed event', async function() {
      const el = await fixture<XFire>(`<x-fire></x-fire>`);
      const type = 'foo';
      setTimeout(() => el.fire('foo', 2, { composed: true }));
      const { composed } = await oneEvent(el, type);
      expect(composed).to.be.true;
    });
  });
});
