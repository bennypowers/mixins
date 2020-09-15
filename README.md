# `@pwrs/mixins`

Useful mixins for custom-element authors.

# `SelectMixin`

Manages the state of a [multi-]select element, e.g. a dropdown or a data table.

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
```

```html
<fire-element></fire-element>

<script defer async>
  document.querySelector("fire-element")
    .addEventListener('😛', e => console.log(e.detail));

  customElements.define('fire-element',
    class FireElement extends FireMixin(HTMLElement) {
      connectedCallback() {
        this.fire('😛', 'Haha!');
      }
    });

</script>
```

logs: `Haha!`;

See [`FireMixin` README](./src/fire/README.md)
