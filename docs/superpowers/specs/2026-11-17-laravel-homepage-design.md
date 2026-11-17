# Laravel-Inspired Developer Homepage — Design

## Intent & why

Replace the default starter-kit welcome page with a polished, premium,
developer-focused marketing homepage for a fictional Laravel-based
platform, visually inspired by laravel.com's quality and hierarchy, built
with original content (no copied copy, assets, or source).

## Goals

- A single-page homepage at `/` with: navbar, hero, trust/stats strip,
  features grid, developer-experience split section, ecosystem grid,
  full-width code example, community grid, final CTA, footer.
- Dark, premium, minimal aesthetic: near-black background, red/pink
  accent gradients, rounded cards, subtle hover/scroll animations.
- Fully responsive (375px–1440px+), no horizontal overflow.
- Accessible: semantic HTML, heading hierarchy, focus states, alt text,
  `prefers-reduced-motion` support.
- SEO: title, meta description, Open Graph tags via Inertia `<Head>`.
- Native to the existing stack: Inertia v3 + React 19 + TypeScript +
  Tailwind v4, built from the project's own `components/ui` primitives.

## Non-goals / anti-goals

- Not a pixel clone of laravel.com; no copied source, assets, or copy.
- Not a new design system, CMS, or backend content model — content is
  static TSX/data, no new database tables or admin UI.
- Does not touch authentication, existing routes, or any page other than
  the homepage.
- No new npm dependencies (no animation or syntax-highlighting library).

## Constraints

- Stack is fixed: Inertia v3 / React 19 / Tailwind v4 / lucide-react —
  not Blade.
- `/` stays mapped to `resources/js/pages/welcome.tsx`
  (`Route::inertia('/', 'welcome')->name('home')` in `routes/web.php`,
  unchanged).
- Reuse existing `components/ui` primitives (`Button`, `Card`, `Sheet`,
  etc.) instead of duplicating them.
- Reuse Wayfinder route helpers (`login()`, `register()`, `dashboard()`
  from `@/routes`) for all auth-aware CTAs — no hardcoded auth URLs.
- Do not modify the global theme tokens in `resources/css/app.css`
  (`:root` / `.dark` `--primary`, `--background`, etc.) — those are
  shared with the dashboard and auth pages. The homepage's dark/red
  aesthetic is scoped to its own markup via literal Tailwind utility
  colors (zinc/red/pink/rose), not the shared `--color-*` semantic
  tokens, and is visually dark regardless of the user's light/dark
  appearance preference (same as laravel.com itself).
- No new dependencies: "syntax highlighting" in code blocks is static
  hand-styled `<span>` tokens inside a shared `CodeWindow` chrome
  component, not a highlighting library.
- Scroll-reveal animation is a small custom `IntersectionObserver` hook,
  not a library; it must resolve to "visible, no animation" immediately
  when `prefers-reduced-motion: reduce` matches.
- Per this project's test rules (AGENTS.md), this is a layout/content/
  styling change: no new automated tests are required, but
  `npm run types:check` and `npm run build` must pass, and the page must
  be verified in a browser (desktop + mobile, console clean, no broken
  links, no layout shift from animations).

## Approaches considered

1. **One large `welcome.tsx` file** with all markup inline. Rejected:
   hard to review, hard to hold in context, diverges from the project's
   existing pattern of small focused components.
2. **Decompose into section/primitive components under
   `resources/js/components/home/`**, composed by `welcome.tsx`. Chosen:
   matches the existing `components/ui` and `components/*` conventions
   in this codebase, keeps each section independently reviewable, and
   lets shared visual patterns (card, code window) be reused instead of
   duplicated across sections.
3. **Pull in a UI/animation library** (Framer Motion, a syntax
   highlighter) for polish. Rejected: explicitly disallowed by the user
   and by AGENTS.md ("do not change the application's dependencies
   without approval"); the desired effects are achievable with CSS
   transitions + one small hook.

## Decisions (builder's inputs)

- Shared primitives: `CodeWindow` (editor chrome: traffic-light dots,
  filename tab, `<pre>` body) and `InfoCard` (icon + title + description
  card, with a `compact` variant for the trust strip and an optional
  `href` for an arrow-link affordance) are reused across every section
  that needs them (hero, dev-experience, code-example use `CodeWindow`;
  trust, features, ecosystem, community use `InfoCard`).
- Navbar: desktop horizontal nav, sticky; mobile uses the existing
  `Sheet` component as the drawer. Items: Documentation, Features,
  Ecosystem, Community, Pricing, GitHub, "Get Started" CTA.
    - Features / Ecosystem / Community scroll to their section's own
      `id` (`#features`, `#ecosystem`, `#community`).
    - Documentation scrolls to the developer-experience section
      (`#dev-experience`), which is the closest on-page stand-in for docs.
    - Pricing and GitHub have no backing page/repo in this app, so they
      are placeholder `href="#"` links (standard for a single-page demo
      with no further pages) rather than fabricated external URLs.
- Auth-aware CTAs (navbar, hero, final CTA): `auth.user` present → single
  "Dashboard" button to `dashboard()`; absent → "Log in" link to
  `login()` plus a primary "Get Started" button to `register()`.
- Content (feature list, ecosystem list, community list, code snippets)
  is original, written for this plan, inspired only by the general shape
  of laravel.com's sections — not copied.

## What's left to the builder

- Exact Tailwind utility values for spacing/typography scale, exact
  gradient stops, and exact icon choices per feature/ecosystem/community
  item (pick sensible `lucide-react` icons per item).
- Exact wording of supporting copy beyond the headings/CTAs the user
  specified verbatim in their brief.
