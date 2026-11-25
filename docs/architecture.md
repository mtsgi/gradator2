# Architecture

Gradator 2 is designed as a visual CSS gradient editor built on reusable, framework-agnostic TypeScript packages.

## Repository layout

```text
gradator2/
├─ apps/
│  └─ web/
├─ packages/
│  ├─ core/
│  └─ css/
└─ docs/
```

## Package responsibilities

### `packages/core`

Owns the semantic gradient model and editing operations.

It must not depend on Vue, browser DOM APIs, or CSS text parsing.

Planned responsibilities:

- gradient data model
- linear / radial / conic variants
- repeating gradients
- color stops and color hints
- positions and angles
- immutable editing operations
- normalization and validation
- primitives suitable for undo / redo

### `packages/css`

Owns conversion between CSS text and the semantic model from `core`.

Planned public API:

```ts
parseGradient(source)
serializeGradient(gradient)
parseBackground(source)
serializeDeclaration(gradient)
```

The first implementation should favor a semantic editor model over lossless source formatting.

### `apps/web`

The visual editor.

The app should consume the public APIs of `core` and `css` rather than reimplementing gradient rules in Vue components.

## Data flow

```text
UI
 ↓
Gradient model
 ↓
normalize / validate
 ↓
CSS serializer
```

For imported CSS:

```text
CSS source
 ↓
CSS parser
 ↓
Gradient model
 ↓
Visual editor
```

## Initial gradient model

```ts
type Gradient =
  | LinearGradient
  | RadialGradient
  | ConicGradient

interface GradientBase {
  id: string
  repeating: boolean
  stops: GradientStop[]
}
```

Repeating gradients are modeled as a property of the three primary gradient types rather than six separate editor types.

## Design principles

1. Keep the core framework-agnostic.
2. Store semantic values, not generated CSS strings, as application state.
3. Generate CSS from the model.
4. Make editing operations immutable where practical.
5. Preserve enough unit information for CSS import/export.
6. Keep advanced CSS Color features extensible instead of baking them into the MVP.
