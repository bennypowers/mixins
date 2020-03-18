# `@pwrs/mixins`

Useful mixins for custom-element authors.

# `SelectMixin`

```js
class SelectElement extends SelectMixin(LitElement) {
  static allowedChildren = ['select-item']
}
```

```html
  <select-element>
    <select-item></select-item>
    <select-item></select-item>
    <select-item></select-item>
  </select-element>
```

See [`SelectMixin` README](./src/select/README.md)

# `FireMixin`

```js
class FireElement extends FireMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `<button>Hah!</button>`
    this.shadowRoot.querySelector('button')
      .addEventListener('click', (event) => {
        // NB: probably shouldn't use bubbles or composed
        this.fire('😛', 'Haha!', { bubbles: true, composed: true })
      })
  }
}
```

```js
html`<fire-element @😛="${e => console.log(e.detail)}"></fire-element>`;
// 'Haha!'
```
