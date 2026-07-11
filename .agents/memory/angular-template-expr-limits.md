---
name: Angular template expression limits
description: TypeScript casts and arrow functions that compile fine in .ts files fail with confusing NG5002 parser errors when written directly in Angular templates.
---

Angular's template expression parser is not TypeScript — it accepts a restricted expression grammar. Two forms that look fine but fail at build time with `NG5002: Parser Error`:

- `as` type assertions, e.g. `(click)="toggleThing(x as any)"` — the parser doesn't understand `as` at all and throws misleading "Missing expected )" / "Unexpected token ')'" errors that look like a parenthesis-matching bug.
- Arrow functions, e.g. `{{ items.find(i => i.id === x)?.name }}` — throws "Bindings cannot contain assignments" (because `=>` reads as containing `=`), plus a cascading TS2769 overload error.

**Why:** the template parser deliberately excludes arbitrary JS/TS syntax (no arrow functions, no type assertions, no `new`, etc.) to keep template expressions simple and safely sandboxed.

**How to apply:** when a template needs to cast a loosely-typed loop variable (e.g. iterating a literal string array against a union-typed method param) or needs a `.find()`/`.filter()` callback, move that logic into a plain component method that takes the loose type (e.g. `string`) and does the cast/lookup internally, then call that method from the template with no inline cast or arrow function.
