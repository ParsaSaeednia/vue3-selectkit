# Right-to-left, naturally

Inherit the page direction or set it on one select.

## Persian example

<ClientOnly><GuideDemo kind="rtl" /></ClientOnly>

## Direction and messages

Set `dir="rtl"` explicitly, or inherit `dir` from an ancestor. Logical layout keeps controls, tags, clear buttons and dropdown alignment in the correct direction. Teleported dropdowns retain the original direction.

Translate built-in text with `messages`. The full `SelectMessages` interface includes `search`, `empty`, `noResults`, `loading`, `selectAll`, `selectAllLoaded`, `clear`, `remove`, `create`, `retry`, `loadError`, `createError`, `limit`, and `required`.

Vertical keyboard navigation stays the same in both directions. Use a `single-value` or `option` slot for mixed-direction content such as Latin email addresses, and set `dir="ltr"` on that inner text when appropriate.
