# Large lists, small DOM

Render the visible rows while keeping the complete loaded selection model.

## Enable virtualization

Add `virtual` to the same component. No separate component or CSS framework is required.

```vue
<VueMultiselect
  v-model="selected"
  :options="items"
  option-key="id"
  label-key="name"
  multiple
  searchable
  virtual
  show-select-all
  :max-height="256"
  :estimate-option-height="36"
/>
```

## Custom rows and groups

TanStack Virtual measures rendered rows, including custom slot contents and group headers. `estimate-option-height` helps the initial measurement; use an estimate close to your custom row height.

The keyboard-active option stays mounted and is scrolled into view, preserving its accessible active-descendant reference. Home and End navigation operate on the complete list.

## Search and selection

Local filtering still checks every loaded option. Select all uses the complete matching set, not only visible rows. Selected values and labels remain available when their rows scroll out of view.

Try **Virtual scrolling** in the playground to load a 10,000-option example. Virtualization handles rendering; fetch pagination belongs to your application.
