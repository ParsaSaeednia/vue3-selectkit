# Changelog

## 0.2.0

### Added

- Backward-compatible cursor pagination and infinite scrolling, with a keyboard-accessible Load more action and retry that preserves loaded pages.
- Automatic selected-record resolution via `resolveOptions` and a retryable `resolve-error` event.
- Configurable tag overflow (`maxVisibleTags`, `#tag-overflow`), read-only mode, and group selection (`showGroupSelect`, `#group-select`).
- Localized count/status formatters and additional messages.
- Playground controls, complete typed examples, and npm/pnpm/Bun installation instructions.
- Regression coverage and Chromium, Firefox, and WebKit browser checks.

### Fixed

- The initial pointer click no longer closes a control opened by focus.
- Form reset invalidates pending option creation.
- Settling an aborted creator cannot unlock a newer pending creation.
- Reset follows dynamic form association, DOM reparenting and forms inserted after mount.
- Popup actions retain focus across browsers; labels open reliably and the final page restores keyboard focus.

### Internal

- Extract async request ownership, remote loading and form lifecycle into focused composables.

## 0.1.1

Include a consumer-facing `AGENTS.md` in the npm package, with typed usage examples, value mapping, async behavior, styling and accessibility guidance. Document how to reference it from an application's agent instructions, and validate that the guide ships in the tarball and its Vue example type-checks.

## 0.1.0

Initial release: typed single/multiple selection, custom values and slots, search, grouping, Select all, RTL, native forms, asynchronous loading and creation, virtual scrolling, default/unstyled themes, and an interactive documentation playground.
