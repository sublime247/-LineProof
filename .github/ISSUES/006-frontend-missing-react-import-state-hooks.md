## Title
`QueuePage.tsx` React import placed after usage — hooks and FormEvent break in strict ESM

## Labels
`bug` `frontend` `react`

---

## Problem

Three related issues exist in `frontend/src/pages/QueuePage.tsx`:

1. **`import React from 'react'` was placed at the bottom of the file** (line ~100), after `React.useState` and `React.FormEvent` are referenced at lines 15–17. This causes a `ReferenceError` at runtime in environments that don't hoist named ESM imports, and breaks TypeScript compilation because `React` is used before it's declared.

2. **`useState` is called via `React.useState` rather than the named import**. With React 18 and the JSX runtime (`"jsx": "react-jsx"`), the `React` namespace isn't auto-imported — only named hooks are. The component will throw `Cannot read properties of undefined (reading 'useState')` in production builds.

3. **`Stat` component function is defined after it is used** in the JSX return, which is valid JS hoisting but causes confusing `no-use-before-define` lint warnings and is inconsistent with the rest of the codebase.

---

## Solution

- Move `import React, { useState } from 'react'` to line 1 of the file.
- Replace all `React.useState(...)` calls with `useState(...)` (already imported).
- Replace `React.FormEvent` with `React.FormEvent` via `import type { FormEvent } from 'react'` or keep the `React` namespace but import it at the top.
- Move the `Stat` helper component above `QueuePage` or into its own file at `frontend/src/components/StatCard.tsx`.

---

## Acceptance Criteria

- [ ] `QueuePage.tsx` has `import React, { useState } from 'react'` at line 1
- [ ] No `React.useState` calls — all hooks use named imports
- [ ] `Stat` component either moved above its usage or extracted to its own file
- [ ] `pnpm --filter @lineproof/frontend exec tsc --noEmit` passes with zero errors
- [ ] Component renders correctly in the browser without console errors

---

## Note for Contributors
If you're assigned to this issue, your PR description must explain where the `React` import was, why it caused the error, and include a screenshot of the QueuePage rendering successfully in the browser with an active queue loaded from the API. Also run `pnpm --filter @lineproof/frontend exec tsc --noEmit` and paste the output.
