# Gradator 2

A visual CSS gradient editor and TypeScript toolkit.

Gradator 2 is the successor to [Gradator](https://github.com/mtsgi/gradator), rebuilt around a library-first architecture for creating, editing, parsing, and serializing CSS gradients.

## Goals

- Support linear, radial, and conic gradients
- Support repeating gradients
- Provide an interactive visual editor
- Keep the gradient model and editing logic framework-agnostic
- Parse CSS gradients into an editable model
- Serialize the model back to CSS
- Make the core reusable outside the web app

## Planned architecture

```text
gradator2/
├─ apps/
│  └─ web/
└─ packages/
   ├─ core/
   └─ css/
```

- `@gradator/core`: gradient data model and editing operations
- `@gradator/css`: CSS gradient parser and serializer
- `apps/web`: Gradator 2 visual editor

## Status

Early development.
