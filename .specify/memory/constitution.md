<!--
Sync Impact Report:
- Version change: none (unfilled template) → 1.0.0
- Modified principles: none (first generation; all template placeholders replaced)
- Added principles:
  I. Version Control and Review; II. Commit Messages; III. Security and Secrets;
  IV. Observability; V. Versioned Contracts; VI. Specification Traceability;
  VII. No Silent Divergence; VIII. Code as Documentation; IX. Type Safety;
  X. Single Responsibility; XI. Naming Conventions;
  XII. Component Architecture; XIII. Semantic HTML; XIV. Styling Standards;
  XV. BEM Methodology; XVI. State Management; XVII. Async State Correctness;
  XVIII. API Integration; XIX. API and Data Boundaries;
  XX. Design System Component Usage; XXI. Deprecated Components;
  XXII. Token Consumption; XXIII. Microfrontend Isolation;
  XXIV. Host Communication; XXV. Linting and Formatting; XXVI. Testing;
  XXVII. Accessibility; XXVIII. Performance; XXIX. Internationalization;
  XXX. Defensive Programming; XXXI. Maintainability
- Base principles not adopted: Changelog Maintenance (root base) — this
  repository is an application, not a published library, and does not
  maintain a changelog (recorded under Governance).
- Added sections: Core Principles, Design System Integration,
  Microfrontend Principles, Quality Standards, Project Stack and Layout,
  Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/spec-template.md ⚠ pending: has no
    "Inheritance from Product Spec" section required by Principle VI
  - .specify/templates/plan-template.md ⚠ pending: "Constitution Check" gates
    are generic; plans MUST check against the principles below
  - .specify/templates/tasks-template.md ✅ no change required
- Follow-up TODOs:
  - TODO(BRANCH_PROTECTION): verify on GitHub that `main` blocks direct pushes
    and requires one approval plus the "lint-test-build" check (Principle I).
  - TODO(DEPENDENCY_AUDIT): CI (.github/workflows/test-and-build.yml) runs no
    vulnerability scan (e.g. `npm audit`, Dependabot) (Principle III).
  - TODO(TS_STRICT): tsconfig.json has `"strict": false`; Principle IX requires
    strict mode. Enabling it needs a migration plan for existing files.
  - TODO(NAMING_EXCEPTION): existing `.vue` files and component directories use
    PascalCase (e.g. src/components/chats/ChatHeader.vue, ContactInfo/), which
    conflicts with the lowercase file/directory rule of Principle XI. Either
    record an explicit exception via amendment or plan a migration.
  - TODO(PRODUCT_SPEC_REPO): define the product spec repository that
    engineering specs in `specs/` pin to (Principle VI).

Provenance:
- Source: weni-ai/vtex-cx-engineering-constitutions (main)
- Bases: base-constitution.md, frontend/base-constitution.md,
  frontend-platform/base-constitution.md
- Domains: frontend-platform (extends frontend)
-->

# Weni Chats Webapp (Live Desk) Constitution

Constitution for `chats-webapp`, the Weni Live Desk human-service module. It is
a CX Platform microfrontend: a Vue 3 application exposed as a Module Federation
remote (`chats`) and consumed by the Connect host (`weni-webapp`), and also
runnable standalone. Precedence: VTEX CX engineering root > frontend >
frontend-platform > this project's instantiation.

## Core Principles

### I. Version Control and Review

All code MUST enter `main` through a pull request. A merge MUST require at least
one approved review and a green CI run of the `lint-test-build` job
(`.github/workflows/test-and-build.yml`). Direct pushes to `main` MUST be
blocked via GitHub branch protection. Reviewers are assigned through
`.github/CODEOWNERS`, and PR descriptions MUST follow
`.github/pull_request_template.md`.

**Rationale:** the policy is only real when enforced by the platform, not by
trust. Peer review and a protected main branch keep history auditable and
prevent unreviewed changes from reaching production.

### II. Commit Messages

Commits MUST follow Conventional Commits: `<type>: <description>`. Allowed types
are `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. The description MUST be
imperative, specific, and no longer than 50 characters. Commits MUST be atomic:
one logical change per commit.

**Rationale:** conventional commits enable automated changelog generation and
semantic versioning. Atomic commits simplify bisecting, reverting, and
reviewing.

### III. Security and Secrets

Secrets MUST never be committed. `.env`, `.env.local`, and `.env.*.local` MUST
remain git-ignored; `.env.local.sample` MUST contain only placeholder values.
Secrets MUST come from an external secrets manager and be injected at runtime
(runtime configuration reaches the app through `window.configs`, injected by
`docker-entrypoint.sh` and read via `src/utils/env.js`). Because every value in
the client bundle or `window.configs` is public, secrets MUST NOT be shipped to
the browser at all; only public configuration (API URLs, public keys) MAY be.
Access MUST follow least privilege. Dependencies MUST come only from trusted
registries and MUST be checked for known vulnerabilities.

**Rationale:** leaked credentials and untrusted dependencies are among the most
common and most damaging breaches; prevention is far cheaper than remediation.

### IV. Observability

Logs and error reports MUST be structured and MUST never contain secrets,
authentication tokens, or sensitive personal data (contact names, phone numbers,
message contents). This applies to Sentry (`@sentry/vue`) events and to
LogRocket session recordings, which MUST sanitize or exclude such data. Errors
MUST be traceable across components and to the backend through correlation or
trace identifiers.

**Rationale:** structured, privacy-safe telemetry is what makes incidents
diagnosable without creating new data-exposure risks. A human-service desk
handles end-customer conversations, so telemetry leakage is a real privacy risk.

### V. Versioned Contracts

Any change to a public interface MUST be versioned following SemVer, MUST be
backward compatible or ship with an announced deprecation path, and MUST NOT be
a silent breaking change. In this repository the public interfaces are: the
federated module `chats/main` (`src/main.js`), the host events emitted through
`emitToHost` on the `chatsToHost` channel (`src/utils/hostBridge.ts`), the
consumed `connect/sharedStore` contract, and the backend REST/WebSocket
contracts as used by `src/services/api/`.

**Rationale:** the Connect host and this module deploy independently; explicit
versioning and deprecation give consumers a predictable path to adapt without
outages.

### VI. Specification Traceability

Every engineering spec under `specs/` MUST derive from exactly one approved
product spec and MUST reference it through an immutable, pinned version (commit
or tag); a mutable URL or ID alone MUST NOT be used. The product spec MUST exist
and be tagged before its engineering spec is created. An engineering spec MUST
NOT redefine the "what" it inherits (problem, scope, success criteria, binding
decisions). A technical architecture document SHOULD be produced for
non-trivial features; when it exists it MUST be linked and pinned by
commit/tag, but its absence MUST NOT block the engineering spec.

Every engineering spec MUST open with this inheritance section, exactly:

```
## Inheritance from Product Spec
- Product Spec: <title> — <URL>
- Pinned version: <commit/tag>
- Architecture doc: <none | URL + commit/tag>
- Inherited binding decisions: <short list>
- Scope of this spec: <slice implemented by this repo>
- Divergences: <none | link to amendment>
```

**Rationale:** pinning guarantees every team implements the same version of a
feature; a mandatory product spec prevents engineering work without an agreed
problem; a uniform format keeps the link machine-checkable across repositories.

### VII. No Silent Divergence

When a technical need contradicts something inherited from the product spec
(scope, success criteria, or a binding decision), the divergence MUST NOT be
implemented silently in code. It MUST be raised as an amendment in the product
repository and recorded in the spec's `Divergences` field with a link. Once the
amendment is approved and tagged, the spec's `Pinned version` MUST be updated.
A technical difference that contradicts nothing inherited is an implementation
decision and MUST live in the engineering spec.

**Rationale:** with the product spec as the single source of truth, silent code
deviations make intent and implementation drift apart with no audit trail.

### VIII. Code as Documentation

All code MUST be written in English, including identifiers, comments, and
documentation. Domain terms or acronyms meaningful only in the original language
MAY remain untranslated. Code MUST prioritize readability over brevity. Every
non-trivial decision MUST be documented with comments explaining the "why", not
the "what".

**Rationale:** Weni projects are open source; a globally comprehensible codebase
enables cross-team and community contribution and prevents future developers
from breaking invariants they cannot see.

### IX. Type Safety

All new files MUST be written in TypeScript (`.ts`, or `<script lang="ts">` in
`.vue` SFCs). Existing JavaScript files SHOULD only be modified for bug fixes or
small changes; substantial modifications SHOULD include migration to
TypeScript. Type definitions MUST be explicit; `any` SHOULD be avoided except
when interfacing with untyped external libraries. Strict mode MUST be enabled
in `tsconfig.json`.

**Rationale:** static typing catches errors at compile time, improves tooling,
and serves as inline documentation. Gradual migration allows incremental
adoption of TypeScript across the remaining JavaScript code without blocking
delivery.

### X. Single Responsibility

Each file SHOULD contain no more than 350 lines of code. Each function MUST have
only one responsibility. Template logic MUST be extracted to computed properties
or methods. Complex conditional rendering MUST be abstracted into descriptive
boolean variables.

**Rationale:** small, focused units are easier to test, review, and refactor;
readable templates make a component's visual structure immediately apparent.

### XI. Naming Conventions

Variable and function names MUST use `camelCase`. Component names MUST use
`PascalCase`. File and directory names MUST be lowercase. Abbreviations MUST be
avoided unless universally understood; clarity MUST take precedence over
conciseness.

**Rationale:** consistent naming reduces cognitive load and makes the codebase
searchable; predictable file naming enables tooling and faster navigation.

### XII. Component Architecture

Components MUST be named descriptively and reflect their purpose, and related
components SHOULD be grouped in feature folders (e.g. `src/components/chats/`,
`src/components/dashboard/`). Component prefixes SHOULD indicate scope or nature.
Props MUST have descriptive names. Events MUST be prefixed with `on` (e.g.
`onUserEmailChange`). State-updating handlers SHOULD be prefixed with `handle`.
State variables MUST clearly reflect what they represent (e.g. `isLoadingUser`).

**Rationale:** predictable structure and naming of props, events, and state make
component interfaces self-documenting and reduce integration errors.

### XIII. Semantic HTML

Templates MUST use semantic elements (`header`, `nav`, `main`, `section`,
`article`, `aside`, `footer`) wherever they apply; `div`/`span` MUST only be used
when no semantic alternative exists. Heading tags MUST follow a logical
hierarchy and every page MUST have exactly one `h1`. Elements SHOULD carry at
least one class describing their purpose, even when unstyled.

**Rationale:** semantic HTML improves assistive-technology support and makes
markup self-documenting; heading hierarchy is critical for screen reader
navigation.

### XIV. Styling Standards

CSS selectors MUST use classes only; IDs MUST be reserved for JavaScript
targeting when no alternative exists. Nested selectors SHOULD be avoided. Design
system tokens MUST be used instead of hardcoded values whenever available (see
Principle XXII).

**Rationale:** avoiding IDs and deep nesting prevents specificity wars; tokens
create a single source of truth for the visual language and enable theming,
including the dark theme.

### XV. BEM Methodology

CSS class names MUST follow BEM. Blocks MUST be independent components
(`.button`), elements MUST use double underscores (`.button__text`), and
modifiers MUST use double hyphens (`.button--large`). Elements MUST NOT be
nested in class names (`.block__elem`, not `.block__elem1__elem2`).

**Rationale:** BEM provides collision-free CSS that scales across large
applications and teams, which matters doubly inside a host application.

### XVI. State Management

Global state MUST be managed through Pinia stores in `src/store/modules/`. State
MUST NOT be duplicated across components or stores. Related state SHOULD be
grouped in feature modules (e.g. `src/store/modules/chats/`). Local component
state SHOULD be preferred when data does not need to be shared. State shared
with the host MUST go through `connect/sharedStore`, not a duplicate local copy.

**Rationale:** a single owner per piece of state prevents synchronization bugs
and keeps data flow traceable.

### XVII. Async State Correctness

Async operations, including WebSocket-driven updates, MUST track loading,
success, and error states consistently. Silent failures MUST NOT occur; errors
MUST be surfaced to the user (e.g. via `callUnnnicAlert`) or logged. Contradictory
states MUST be prevented, double submissions MUST be guarded against, and state
MUST be rolled back when an operation fails after an optimistic update.

**Rationale:** incorrect async state is a top source of bugs and broken UX; an
agent handling live conversations must never be left in limbo.

### XVIII. API Integration

API calls MUST be encapsulated in service modules under
`src/services/api/resources/` (HTTP via `src/services/api/http.js`) and
`src/services/api/websocket/`, never inside components. Error handling MUST be
explicit; API errors MUST NOT surface as unhandled exceptions. Loading and error
states MUST be tracked and reflected in the UI.

**Rationale:** separating API logic from presentation enables reuse, simplifies
testing, and keeps components focused on rendering.

### XIX. API and Data Boundaries

Backend contracts MUST remain at the service boundary. Internal code MUST use
camelCase; snake_case fields from the backend MUST be normalized at the adapter
layer. Raw backend fields MUST NOT leak into stores, business logic, or
components. DTOs or raw API interfaces that intentionally represent the backend
contract MAY use the backend naming convention.

**Rationale:** clean data boundaries decouple the frontend from backend
implementation details and keep the codebase consistent and refactorable.

## Design System Integration

### XX. Design System Component Usage

UI primitives MUST be sourced from Unnnic (`@weni/unnnic-system`) when
available. Custom components MUST NOT duplicate design system functionality.
Unnnic updates MUST be adopted through controlled version upgrades in
`package.json`, not copy-pasted code. The Unnnic skill MUST be consulted for
component references, props, tokens, and usage patterns.

**Rationale:** a shared library guarantees visual consistency across the CX
Platform, reduces duplication, and centralizes accessibility fixes.

### XXI. Deprecated Components

Deprecated Unnnic components MUST NOT be introduced in new code when modern
alternatives exist; the Unnnic skill documents deprecations and replacements.
Existing usages SHOULD be migrated when the surrounding code is modified.

**Rationale:** deprecated components will be removed; preventing new usages
limits migration scope.

### XXII. Token Consumption

Color, typography, spacing, shadow, and radius values MUST reference Unnnic
design tokens (SCSS tokens imported globally from
`@weni/unnnic-system/src/assets/scss/unnnic.scss`), not raw values. Semantic
tokens MUST be preferred over primitive tokens. Tokens MUST NOT be invented;
only tokens documented by the Unnnic skill are valid.

**Rationale:** tokens decouple design decisions from implementation, enabling
global visual changes (including light/dark themes) without hunting through
code.

## Microfrontend Principles

### XXIII. Microfrontend Isolation

The module MUST NOT pollute the host's global scope (`window` properties,
document-level styles). Styles MUST be scoped or prefixed; global CSS is
prefixed with `.chats-webapp` by the PostCSS configuration in
`rspack.config.mjs`, and that prefixing MUST NOT be bypassed. Global event
listeners, timers, and WebSocket connections MUST be cleaned up on unmount.
Dependencies shared with the host (e.g. `vue-router` singleton) MUST be declared
in `sharedDeps`.

**Rationale:** isolation prevents interference with Connect and other
microfrontends and keeps this module independently deployable and testable.

### XXIV. Host Communication

The module MUST communicate with the Connect host only through documented
contracts: events emitted via `emitToHost` on the `chatsToHost` CustomEvent
channel (`src/utils/hostBridge.ts`), the federated `connect/sharedStore`, and the
exposed `./main` entry. Federated imports MUST go through `safeImport`
(`src/utils/moduleFederation.ts`) and MUST degrade gracefully in standalone mode
(`isFederatedModule === false`). Direct DOM manipulation outside the module
boundary MUST NOT occur.

**Rationale:** explicit contracts make integration predictable and let host and
module evolve independently; DOM encapsulation prevents fragile coupling.

## Quality Standards

### XXV. Linting and Formatting

All code MUST pass `npm run lint` without errors before merge. The ESLint
configuration MUST extend `@weni/eslint-config` (currently
`@weni/eslint-config/vue3` in `.eslintrc.js`). Formatting MUST be enforced by
Prettier through the lint tooling; style debates MUST NOT occur in code review.

**Rationale:** a shared configuration ensures consistency across Weni frontend
projects; automated enforcement removes subjective review discussions.

### XXVI. Testing

Components and modules with business logic MUST have unit tests written with
Vitest, `@vue/test-utils`, and `@pinia/testing`. Test files MUST be colocated in
a `__tests__/` directory next to the code under test, named `*.spec.{js,ts}`.
Tests MUST verify behavior and outcomes, not implementation details. Tests MUST
NOT be added solely to raise coverage; a test that would still pass after a
regression MUST be fixed or removed. `npm run coverage` runs in CI and reports to
Codecov.

**Rationale:** colocated, behavior-focused tests survive refactors and catch real
bugs; coverage-padding tests provide false confidence.

### XXVII. Accessibility

Interactive elements MUST be keyboard accessible. Form inputs MUST have
associated labels. Color MUST NOT be the only means of conveying information.
Images MUST have meaningful `alt` text or `alt=""` when decorative. Focus states
MUST be visible. `eslint-plugin-vuejs-accessibility` findings MUST be resolved.

**Rationale:** accessibility is a legal requirement in many jurisdictions and
improves usability for every agent using the desk.

### XXVIII. Performance

Unused dependencies MUST be removed. Heavy computations MUST be memoized or
debounced on frequent events (message streams, typing, scrolling). Assets
(images, fonts, sounds) MUST be optimized. Bundle size impact SHOULD be
considered before adding dependencies. Initial load SHOULD prioritize
above-the-fold content.

**Rationale:** the module loads inside the host on every navigation to Live
Desk; lean bundles and efficient updates protect agents on slow networks and
devices.

### XXIX. Internationalization

User-facing strings MUST NOT be hardcoded; they MUST be externalized to
`src/locales/` and rendered through `vue-i18n`. `src/locales/en.json` is the
Crowdin source; locale files (`en`, `pt_br`, `es`, `ro`) SHOULD maintain parity.
New strings introduced in a PR MUST be localized before merge. Date, number, and
currency formatting MUST respect the user's locale.

**Rationale:** externalized strings enable translation without code changes, and
locale-aware formatting builds trust with international users.

### XXX. Defensive Programming

Defensive guards (null checks, fallbacks, runtime assertions) SHOULD only be
added when the invalid state is realistically reachable. Root causes MUST be
fixed rather than masked. Guards MUST follow patterns established in the
surrounding code.

**Rationale:** unnecessary defensive code obscures real logic; fixing root causes
produces more robust code than layers of protection.

### XXXI. Maintainability

Business rules MUST NOT be duplicated; they MUST be centralized in a single
source of truth (stores, `src/utils/`, or composables in `src/composables/`).
Local duplication of utility code MAY exist when extraction would create
unnecessary coupling. Abstractions SHOULD only be created when a clear pattern
exists across multiple use cases.

**Rationale:** premature abstraction creates coupling worse than the duplication
it removes; centralize business rules and tolerate incidental duplication.

## Project Stack and Layout

- **Framework:** Vue 3 (Composition and Options API), Vue Router 4, Pinia,
  vue-i18n; Sass for styles.
- **Build:** Rspack via `@weni/rspack-config` (`rspack.config.mjs`), Module
  Federation remote `chats` exposing `./main`, consuming remote `connect`;
  entry `src/bootstrap.js`.
- **Tests:** Vitest + jsdom (`vite.config.mjs`, `setupVitest.js`).
- **Design system:** `@weni/unnnic-system`.
- **Layout:** `src/components/`, `src/views/`, `src/layouts/`,
  `src/composables/`, `src/store/modules/`, `src/services/api/`, `src/utils/`,
  `src/locales/`, `src/types/`.
- **CI:** GitHub Actions `test-and-build.yml` (lint → coverage → build) on push;
  Crowdin upload/download workflows for locales.

## Governance

This constitution supersedes conflicting local practices. Precedence for
interpretation is: VTEX CX engineering root constitution > frontend constitution
> frontend-platform constitution > project instantiation in this document. A
project-level exception to a base principle MUST be recorded in this document
via amendment, with explicit justification; unrecorded exceptions are
violations.

Recorded project exceptions:

- **Changelog Maintenance (root base) is not adopted.** This repository is an
  application deployed as a federated remote, not a published library, and
  does not maintain a changelog.

Amendments MUST be proposed by pull request, reviewed under Principle I, and
include an updated Sync Impact Report. Changes to the upstream bases are pulled
in by re-running `setup-engineering`, which MUST preserve still-valid project
exceptions. Versioning follows SemVer: MAJOR for removing or redefining a
principle, MINOR for adding a principle or section, PATCH for clarifications.

Every implementation plan MUST pass a Constitution Check against these
principles before design and again after it. `/speckit.analyze` MUST treat any
conflict with a `MUST` as CRITICAL. Pull request reviews MUST verify compliance;
added complexity MUST be justified in the plan.

**Version**: 1.0.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
