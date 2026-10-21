# Contributing

Use Node.js 24+ and npm. Run `npm ci`, then `npm run dev` for the documentation playground.

Before submitting a change, run `npm run release:check` and `npm run test:e2e` (install Chromium once with `npx playwright install chromium`). Update the shared documentation metadata and generated examples when changing the API. Keep Vue a peer dependency and preserve keyboard, RTL, and native form behavior.

Consumer type fixtures include expected failures; removing inference or widening a public type must not silently make these fixtures pass.
