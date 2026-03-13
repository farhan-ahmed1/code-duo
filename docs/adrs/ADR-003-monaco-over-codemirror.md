# ADR-003: Choose Monaco Editor Over CodeMirror

## Status

Accepted

## Context

Code Duo is a collaborative code editor for developers. The editor must feel familiar, support mainstream programming languages, and integrate cleanly with the CRDT collaboration layer. The product value is highest when the browser editor behaves like a modern IDE rather than a generic text area.

## Options Considered

1. Monaco Editor
2. CodeMirror 6
3. A lightweight textarea-based editor

## Decision

Use Monaco Editor as the primary editing surface.

## Rationale

- Monaco matches developer expectations because it is the editor engine behind VS Code.
- It provides strong built-in language tooling, keyboard behavior, and editor primitives for code-centric workflows.
- The existing `y-monaco` integration reduces collaboration-specific wiring compared with building custom bindings.
- The editor experience is part of the product strategy, so higher bundle cost is acceptable in exchange for familiarity and capability.

## Trade-offs Accepted

- Monaco has a larger bundle footprint than CodeMirror and must be loaded client-side.
- SSR is not practical for the editor component itself, so the application needs a hybrid rendering model.
- Monaco customization is more complex in some browser-hosted scenarios than a smaller composable editor.
- Mobile support is weaker than a lightweight editor optimized for touch-first interaction.
