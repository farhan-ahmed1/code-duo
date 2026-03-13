# ADR-006: Choose a Monorepo With pnpm and Turborepo

## Status

Accepted

## Context

Code Duo contains a web app, a server, and shared TypeScript contracts. Architecture work, CI, and releases need coordinated changes across these packages. The team wants shared types and build tooling without publishing internal packages for every change.

## Options Considered

1. Monorepo with pnpm workspaces and Turborepo
2. Separate repositories for web, server, and shared code
3. Monorepo without a build orchestrator

## Decision

Use a monorepo with pnpm workspaces and Turborepo.

## Rationale

- Shared constants and types move across the stack with a single change set, which is important for WebSocket protocol, room metadata, and environment assumptions.
- CI and local development remain consistent because linting, type-checking, tests, and builds run from one workspace.
- Turborepo provides incremental task orchestration that keeps the monorepo fast enough as the codebase grows.
- pnpm workspaces keep dependency installation efficient and avoid duplicated package state.

## Trade-offs Accepted

- The repository has more tooling complexity than separate projects.
- CI caching and task configuration require more attention than a single-package setup.
- A broken shared package can affect both applications at once.
- The team accepts a wider blast radius in exchange for tighter cross-package coordination.
