---
name: Canvas editor DOM handler pattern
description: How to add new DOM event handlers to CanvasEditorComponent without TypeScript errors
---

## Rule
New DOM event handlers must be declared as bound properties at the top of the class body (lines ~403-412), following the existing pattern:

```ts
private readonly canvasXyzHandler = this.handleCanvasXyz.bind(this);
```

Then implement the logic as a regular private method:

```ts
private handleCanvasXyz(e: MouseEvent): void { ... }
```

**Why:** Defining handler arrow functions late in the file (line 3900+) causes `TS2339: Property does not exist` errors in the Angular compiler even though they are valid TypeScript class fields. The compiler processes property declarations before method bodies and the late-defined fields are not recognized at the use-site in setupCanvasPanning / ngOnDestroy.

**How to apply:** Any time you add a new DOM addEventListener call to setupCanvasPanning, also add the bound property declaration at lines 403-412 and the method implementation anywhere in the file.
