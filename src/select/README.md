# 

**Mixins:** FireMixin

## Properties

| Property               | Attribute                | Modifiers | Type                 | Default    | Description                                      |
|------------------------|--------------------------|-----------|----------------------|------------|--------------------------------------------------|
| `attributeForSelected` | `attribute-for-selected` |           | `string`             | "selected" | The boolean attribute on items which, when present, indicates that the item is selected. |
| `focusedIndex`         | `focusedIndex`           |           | `number`             |            | The index of the focused item                    |
| `focusedItem`          | `focusedItem`            |           | `Item`               |            | The focused item                                 |
| `hasActiveItem`        |                          | readonly  | `boolean`            |            | Whether one of the items is the active element (i.e. focused) |
| `items`                | `items`                  |           | `Item[]`             |            | The selectable items                             |
| `multi`                | `multi`                  |           | `boolean`            | false      | Whether multiple selections are allowed          |
| `selectedIndex`        | `selected-index`         |           | `number \| number[]` |            | The currently selected item's index              |
| `selectedItem`         | `selectedItem`           |           | `Item \| Item[]`     |            | The currently selected Item                      |
| `value`                | `value`                  |           | `unknown`            |            | Selected Item's Value                            |

## Methods

| Method           | Type                                             | Description                                      |
|------------------|--------------------------------------------------|--------------------------------------------------|
| `fire`           | `(type: string, detail: any, { bubbles, composed }?: EventInit \| undefined): boolean` | Fires a CustomEvent with an optional supplied detail.<br /><br />Fired events do not bubble and are not composed. For composed events,<br />use `dispatchEvent`.<br /><br />**type**: CustomEvent type<br />**detail**: detail value<br />**options**: options initializer |
| `onItemsChanged` | `(event: CustomEvent<any>): void`                | Handles a change in the items.<br /><br />**event**: items-changed event |
| `onSelect`       | `(): void`                                       |                                                  |
| `selectIndex`    | `(selectedIndex: number): void`                  | Updates the read-only `selectedItem` and `selectedIndex` properties<br />Updates the `value` property<br /><br />**selectedIndex**: selectedIndex |
| `selectNext`     | `(): void`                                       | Selects the next item in the list.<br />Wraps around to first item from last. |
| `selectPrevious` | `(): void`                                       | Selects the previous item in the list.<br />Wraps around to last item from first. |

## Events

| Event    | Description              |
|----------|--------------------------|
| `select` | When an item is selected |
