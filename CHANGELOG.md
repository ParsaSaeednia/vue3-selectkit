# Changelog

## 0.2.1

- Fix Vue's runtime Boolean casting for the generic `multiple` prop. The template shorthand now preserves array models, selected labels, bulk actions and repeated native form values, while explicit true/false and dynamic boolean bindings retain their types.
- Add compiled-template regressions for shorthand, empty attributes, explicit booleans, omitted and dynamic modes, plus server rendering/hydration and negative TypeScript checks.
- Add production Nuxt 3.21.11 and Nuxt 4.6.4 integration checks using the packed library, with separate CI jobs that gate site deployment.
- Document Nuxt installation, global CSS, explicit imports, SSR data, and the `#teleports` target in the website, READMEs and consumer agent guide.

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
