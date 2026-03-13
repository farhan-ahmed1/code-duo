# ADR-005: Choose Hono Over Express and Fastify

## Status

Accepted

## Context

The backend needs a small HTTP layer for room APIs, health checks, metrics, and middleware, while the same Node.js process also hosts the WebSocket upgrade path for Yjs synchronization. The team prefers a typed, modern framework that stays out of the way.

## Options Considered

1. Hono
2. Express
3. Fastify

## Decision

Use Hono for the HTTP API layer.

## Rationale

- Hono is lightweight and works well with Web-standard request and response primitives.
- It fits the narrow API surface in this project without bringing the weight of a larger plugin ecosystem that the MVP does not need.
- The current codebase benefits from straightforward middleware composition for CORS, logging, validation, and metrics.
- Hono coexists cleanly with the manually managed Node `http.Server` used for WebSocket upgrades.

## Trade-offs Accepted

- Express has a larger ecosystem and deeper team familiarity across the industry.
- Fastify offers stronger out-of-the-box plugin and performance patterns for a larger API surface.
- Hono-specific examples and third-party integrations are less abundant than Express equivalents.
- The architecture accepts a smaller ecosystem in exchange for simpler typed request handling.
