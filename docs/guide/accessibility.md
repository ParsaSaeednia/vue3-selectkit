# Built for real interaction

Keyboard behavior and accessible names belong to the component, including when its appearance changes.

## Labels and descriptions

Provide `label` for a visible label. Otherwise use `aria-label` or `aria-labelledby`. Connect help text with `aria-describedby`. These component attributes map to `ariaLabel`, `ariaLabelledby`, and `ariaDescribedby` in JavaScript props.

## Keyboard

- Enter, Space, or Arrow Down opens a closed select.
- Arrow Up / Down moves through enabled options; Enter selects or toggles the active option.
- Home / End navigates a non-searchable list; Control + Home / End is available while searching.
- Escape closes and restores focus. Tab follows the normal page order and closes when focus leaves the widget.
- A non-searchable select supports typeahead.
- Select all, clear, tag removal, retry, and create actions are keyboard reachable.

Disabled options are skipped. A selection limit makes additional options unavailable while allowing selected options to be removed.

## Custom slots

Option rows own their listbox role and selection state. Keep option contents noninteractive: decorative checkboxes should not become nested inputs or buttons. Retain readable labels when replacing visual content. The component announces selection changes and exposes stable active-option IDs even with virtualization.

## Validation and direction

Native required validation focuses the visible control. RTL and reduced motion are supported. Test your final colors, translations, and custom slot markup with the assistive technologies used by your audience.
