# Contributing To Code Duo

Code Duo aims to feel precise, reliable, and developer-native. Contributions should improve the product without introducing avoidable complexity, copy drift, or workflow regressions.

## Before You Start

- Read the README for the product overview, local setup, and deployment model.
- Check the docs in `docs/` and the planning artifacts in `agency/` if your change affects architecture, UX, positioning, or roadmap assumptions.
- Prefer focused pull requests over broad refactors.

## Local Setup

```bash
pnpm install
pnpm dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Development Expectations

1. Keep changes scoped to the task you are solving.
2. Preserve the existing developer-facing tone: direct, technical, and restrained.
3. Update docs when code changes alter product behavior, API shape, deployment steps, or user-facing copy.
4. Avoid unrelated cleanup unless it is necessary to complete the change safely.

## Quality Checks

Run the smallest relevant set first, then the broader suite before opening a PR.

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:e2e
```

Useful targeted commands:

```bash
pnpm --filter @code-duo/server test:unit
pnpm --filter @code-duo/web test:unit
pnpm --filter @code-duo/server test:ws
pnpm test:e2e:cross-browser
pnpm test:e2e:stress
pnpm test:e2e:benchmark
```

## Pull Request Guidance

- Explain the user or product problem being solved.
- Call out any architecture, UX, testing, or deployment impact.
- Include screenshots or recordings for meaningful UI changes.
- Note any follow-up work instead of hiding scope in the same PR.

## Documentation Changes

Update the relevant documentation when your change touches:

- Product flow or UI behavior
- API endpoints or payloads
- Collaboration model or persistence behavior
- Deployment configuration or environment variables
- Brand messaging or landing-page copy

## Review Standard

A contribution is ready when it is understandable, tested at the right level, and leaves the repository in a more accurate state than it found it.
