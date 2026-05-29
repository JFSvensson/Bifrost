---
name: Widgets SOLID Rules
description: "Use when editing TypeScript widget modules or UI composition in src/widgets. Enforces clean widget boundaries, SOLID principles, and maintainable rendering behavior."
applyTo: "src/widgets/**/*.ts"
---
# Widgets SOLID Rules

Apply these rules when creating or modifying widget files.

## Responsibility and Composition
- Keep widgets focused on rendering and user interaction concerns.
- Move business rules into services or utilities.
- Prefer composition and shared helpers over duplicated render logic.
- Keep initialization lifecycle clear and predictable.

## Contracts and Dependencies
- Use explicit interfaces/types for widget inputs and outputs.
- Avoid direct cross-widget coupling unless explicitly required.
- Depend on service abstractions or event contracts, not internal service details.
- Keep event names/constants centralized.

## DOM and Accessibility
- Keep DOM updates localized and intention-revealing.
- Avoid mixing parsing/business decisions into render branches.
- Preserve keyboard and accessibility behavior when modifying UI interactions.

## Error and Performance Hygiene
- Handle recoverable UI errors gracefully.
- Avoid repeated expensive DOM queries; cache where practical.
- Keep render/update paths small and easy to reason about.

## Testability
- Separate pure mapping/formatting logic from direct DOM manipulation where possible.
- When behavior changes, add or update targeted tests in tests/utilities or relevant widget test files.
