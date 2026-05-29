---
name: Services SOLID Rules
description: "Use when editing TypeScript service modules, service boundaries, orchestration logic, or business logic in src/services. Enforces SOLID, clean contracts, and maintainable service design."
applyTo: "src/services/**/*.ts"
---
# Services SOLID Rules

Apply these rules when creating or modifying service files.

## Design Boundaries
- Keep each service focused on one business capability.
- Depend on abstractions at boundaries, not concrete UI or DOM details.
- Avoid importing widget code into services.
- Keep side effects isolated and explicit.

## API and Typing
- Export explicit input/output types for public methods.
- Avoid any; prefer narrow union/object types and typed results.
- Use named constants/enums for event names and storage keys.
- Keep method signatures stable unless change is intentional and documented.

## Error Handling
- Fail with context-rich errors and actionable messages.
- Avoid silent catch blocks.
- Route unexpected errors through centralized error handling patterns used in the repo.

## State and Persistence
- Avoid hidden global mutable state.
- Prefer explicit state ownership and dependency-injected collaborators.
- Isolate persistence concerns behind adapter-like functions when possible.

## Testability
- Keep logic deterministic where possible.
- Design for unit testing with minimal setup.
- When behavior changes, add or update targeted tests in tests/services.
