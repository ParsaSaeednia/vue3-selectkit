# Contributing

Use Node.js 24+ and npm. Run `npm ci`, then `npm run dev` for the documentation playground.

Before submitting a change, run `npm run release:check`, `npm run test:e2e` and `npm run test:nuxt` (install browser engines once with `npx playwright install chromium firefox webkit`). Update the shared documentation metadata and generated examples when changing the API. Keep Vue a peer dependency and preserve keyboard, RTL, and native form behavior.

Consumer type fixtures include expected failures; removing inference or widening a public type must not silently make these fixtures pass.

`npm run test:nuxt -- 3` or `npm run test:nuxt -- 4` checks one Nuxt major. Version pins live in `tests/nuxt/versions.json`. The runner builds and packs the library, creates clean applications outside the repository, then checks production builds, types, server HTML without JavaScript, hydration and browser interactions. It removes successful fixtures and retains failed ones for investigation. The optional `SELECTKIT_PACKAGE_SPEC` environment variable accepts a dependency version such as `0.2.1` to test an already published release. `BRAVE_EXECUTABLE_PATH` selects Brave for isolated browser checks; CI uses Playwright Chromium.

Test boolean props through compiled `.vue` templates as well as programmatic mounts. A generic type can preserve TypeScript inference while failing to emit a runtime Boolean prop; bare attributes must be covered in both the source tests and packed-package integration tests.
