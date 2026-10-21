# Make it look like your app

Keep the behavior. Own the visual language.

## CSS variables

Import `vue3-selectkit/style.css` once. Override these public variables on `.vsk-root` and `.vsk-dropdown`:

```css
.vsk-root,
.vsk-dropdown {
  --vsk-accent: #059669;
  --vsk-bg: #fff;
  --vsk-text: #172033;
  --vsk-muted: #667085;
  --vsk-border: #d5dbe3;
  --vsk-highlight: #e7f7f1;
  --vsk-radius: 7px;
  --vsk-font: inherit;
  --vsk-control-height: 42px;
  --vsk-option-height: 36px;
  --vsk-shadow: 0 8px 22px #14203518;
}
```

For a teleported dropdown, apply variables to both roots through a common ancestor or the `dropdown` part class. Styles defined only on the original component root do not inherit across a teleport.

## Part classes

Use `:classes="{ control: 'my-control', option: 'my-option', dropdown: 'my-dropdown' }"`. Named parts are `root`, `control`, `selection`, `trigger`, `tag`, `clear`, `dropdown`, `search`, `listbox`, `option`, `group`, `selectAll`, `create`, `state`, and `footer`.

Stable state hooks include `[data-open]`, `[data-disabled]`, `[data-invalid]`, `[data-selected]`, `[data-highlighted]`, and standard ARIA states. Attribute values are the strings `true` and `false`; use explicit value selectors.

## Unstyled mode

Add `unstyled` to omit default surface, border, chip and option styling. Structural layout and accessibility utilities remain. Use the classes prop or stable `vsk-*` selectors for your own theme, including Tailwind classes supplied through `classes`.

## Slots

Change the content of options, selected values, tags, or the full selection display. Slots do not affect the mapped model. [Explore slots](../api/slots) or use the playground presets.
