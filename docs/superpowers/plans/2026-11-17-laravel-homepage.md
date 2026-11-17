# Laravel-Inspired Developer Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter-kit welcome page with a premium, dark, developer-focused homepage built from new React/TSX components under `resources/js/components/home/`, composed by `resources/js/pages/welcome.tsx`.

**Architecture:** A set of small, focused presentational components (two shared primitives — `CodeWindow`, `InfoCard` — plus one component per homepage section) composed in order inside `welcome.tsx`. No backend or route changes. No new npm dependencies.

**Tech Stack:** Inertia v3, React 19, TypeScript, Tailwind CSS v4, lucide-react, existing `components/ui` (Button, Sheet) and Wayfinder route helpers (`login()`, `register()`, `dashboard()` from `@/routes`).

**Spec:** `docs/superpowers/specs/2026-11-17-laravel-homepage-design.md`

## Global Constraints

- `/` stays mapped to `resources/js/pages/welcome.tsx`; do not change `routes/web.php`.
- Do not modify global theme tokens in `resources/css/app.css` (`:root`/`.dark` `--primary`, `--background`, etc.) — the homepage uses literal Tailwind color utilities (zinc/red/pink/rose), not the shared `--color-*` tokens.
- No new npm dependencies — no animation library, no syntax-highlighter library.
- All auth-aware CTAs use Wayfinder helpers `login()`, `register()`, `dashboard()` from `@/routes` — never hardcoded URLs.
- Reuse `components/ui/button.tsx` (`Button`) and `components/ui/sheet.tsx` (`Sheet*`) rather than new duplicates.
- Scroll-reveal must resolve to "visible, no animation" immediately when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is `true`.
- Per AGENTS.md test rules, this is a layout/content change: no new automated tests required. Every task instead verifies with `npm run types:check`; the final task also runs `npm run build` and a manual browser check.
- Section anchor ids: `#features`, `#ecosystem`, `#community`, `#dev-experience` (Documentation nav item points here). Pricing and GitHub nav items are placeholder `href="#"` (no backing page/repo exists in this app).

## Review Focus

- **Reduced motion:** a user/browser with `prefers-reduced-motion: reduce` must see all sections fully visible with no fade/slide animation and no layout shift — covered in Task 1's hook test and re-checked visually in Task 15.
- **Unauthenticated vs authenticated nav/CTA state:** navbar and hero and final-CTA must each render "Log in" + "Get Started" (→ `register()`) when `auth.user` is absent, and a single "Dashboard" button (→ `dashboard()`) when present — covered in Tasks 4, 5, 12.
- **Mobile nav drawer:** the hamburger must open/close the `Sheet` drawer, list every nav item, and close on link click, at narrow widths (375px) with no horizontal overflow — covered in Task 4 and verified in Task 15.
- **In-page anchor links actually resolve:** `#features`, `#ecosystem`, `#community`, `#dev-experience` must match the `id` rendered by the corresponding section — covered when each section task adds its `id` and re-checked end-to-end in Task 15.
- **No horizontal scroll / overflow at narrow widths:** long code lines, wide grids, and gradient glows must not force horizontal scroll at 375px–480px — explicitly checked in Task 15 across all breakpoints.

---

### Task 1: Scroll-reveal hook

**Files:**

- Create: `resources/js/hooks/use-reveal.ts`

**Interfaces:**

- Produces: `useReveal<T extends HTMLElement = HTMLDivElement>(): { ref: React.RefObject<T | null>; isVisible: boolean }` — later tasks attach `ref` to a section wrapper and conditionally apply a "revealed" vs "pre-reveal" className based on `isVisible`.

- [ ] **Step 1: Implement `useReveal`**

In `resources/js/hooks/use-reveal.ts`: if `typeof window === 'undefined'` or `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true, return `{ ref, isVisible: true }` immediately (no observer created). Otherwise create a `ref` via `useRef<T>(null)`, track `isVisible` via `useState(false)`, and in a `useEffect`, create an `IntersectionObserver` with `{ threshold: 0.15 }` that sets `isVisible` to `true` and disconnects once the observed element intersects; observe `ref.current` if present; disconnect on cleanup.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `use-reveal.ts`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/hooks/use-reveal.ts
git commit -m "feat: add scroll-reveal hook for homepage sections"
```

---

### Task 2: CodeWindow primitive

**Files:**

- Create: `resources/js/components/home/code-window.tsx`

**Interfaces:**

- Produces: `CodeWindow({ filename, className, children }: { filename?: string; className?: string; children: React.ReactNode }): JSX.Element` — later tasks (5, 8, 10) pass hand-styled `<pre>`/`<code>`/`<span>` markup as `children` for their own PHP snippets.

- [ ] **Step 1: Implement `CodeWindow`**

Render a rounded, bordered dark panel (`bg-zinc-900/80`, `border-zinc-800`, `backdrop-blur` optional) with a header row showing three traffic-light dots (`bg-red-500/80`, `bg-amber-400/80`, `bg-emerald-500/80`) and, if `filename` is provided, the filename in a muted monospace label; body is a `<pre>` with `overflow-x-auto` wrapping `children` so long lines scroll inside the window instead of forcing page-level horizontal scroll. Merge `className` onto the outer element via the existing `cn` helper from `@/lib/utils`.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `code-window.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/code-window.tsx
git commit -m "feat: add CodeWindow primitive for homepage code snippets"
```

---

### Task 3: InfoCard primitive

**Files:**

- Create: `resources/js/components/home/info-card.tsx`

**Interfaces:**

- Consumes: any `lucide-react` icon component as `icon`.
- Produces: `InfoCard({ icon: Icon, title, description, compact, href }: { icon: LucideIcon; title: string; description: string; compact?: boolean; href?: string }): JSX.Element` — used by Tasks 6, 7, 9, 11 (trust, features, ecosystem, community).

- [ ] **Step 1: Implement `InfoCard`**

Default (non-`compact`) variant: rounded-xl card, `bg-zinc-900/60` with `border border-zinc-800`, padding, hover transition to a red/pink glow border and subtle `translate-y`/shadow lift (guarded by `motion-safe:` so it's inert under reduced motion); icon in a small rounded badge at the top, `title` as a semibold heading, `description` as muted body text; if `href` is provided, wrap the card in an `<a>` (internal `#anchor` or external) with a visible `focus-visible:ring-2` state and render a trailing arrow glyph that shifts slightly on hover. `compact` variant: a smaller inline chip (icon + title only, no description, tighter padding) for the trust strip.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `info-card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/info-card.tsx
git commit -m "feat: add InfoCard primitive for homepage content cards"
```

---

### Task 4: SiteNavbar

**Files:**

- Create: `resources/js/components/home/site-navbar.tsx`

**Interfaces:**

- Consumes: `Sheet`, `SheetTrigger`, `SheetContent` (or equivalent exports) from `@/components/ui/sheet`; `Button` from `@/components/ui/button`; `login`, `register`, `dashboard` from `@/routes`; `Menu`, `X` icons from `lucide-react`.
- Produces: `SiteNavbar({ isAuthenticated }: { isAuthenticated: boolean }): JSX.Element` — used by Task 14 (`welcome.tsx`).

- [ ] **Step 1: Implement `SiteNavbar`**

Sticky/fixed top bar, `bg-zinc-950/80 backdrop-blur border-b border-zinc-800`. Left: brand/logo text (e.g. "Forge" or similarly original name — not "Laravel") as a link to `#`/top. Center/right (desktop, hidden below `lg`): links "Documentation" (`href="#dev-experience"`), "Features" (`href="#features"`), "Ecosystem" (`href="#ecosystem"`), "Community" (`href="#community"`), "Pricing" (`href="#"`), "GitHub" (`href="#"`), each with a subtle color/underline hover transition and a visible `focus-visible:ring-2`/`focus-visible:outline` state. Right-most: if `isAuthenticated`, a single `Button asChild` wrapping a `Link`/`<a>`-equivalent to `dashboard()` labeled "Dashboard"; else a plain "Log in" link to `login()` plus a primary `Button` to `register()` labeled "Get Started". Below `lg`: a hamburger `Menu` icon as `SheetTrigger`, opening a `Sheet` drawer (`side="right"`) listing the same links stacked, each closing the sheet on click, ending with the same auth-aware CTA(s).

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `site-navbar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/site-navbar.tsx
git commit -m "feat: add homepage navbar with mobile drawer"
```

---

### Task 5: HeroSection

**Files:**

- Create: `resources/js/components/home/hero-section.tsx`

**Interfaces:**

- Consumes: `CodeWindow` (Task 2), `Button` from `@/components/ui/button`, `register`, `dashboard` from `@/routes`.
- Produces: `HeroSection({ isAuthenticated }: { isAuthenticated: boolean }): JSX.Element` — used by Task 14.

- [ ] **Step 1: Implement `HeroSection`**

Full-bleed top section, `bg-zinc-950` with a layered radial/conic gradient glow (red/pink, low opacity, `blur-3xl`, positioned absolute behind content — purely decorative, `aria-hidden`). Two-column layout at `lg` (text left, code right; stacked on mobile). Left: `<h1>` "Build powerful web applications, faster." (large, bold, tight tracking), supporting `<p>` "A modern PHP framework designed to help developers build elegant, scalable, and maintainable applications." (muted), two CTAs: primary `Button` → `isAuthenticated ? dashboard() : register()` labeled "Get Started", secondary outline/ghost `Button asChild` wrapping an `<a href="#dev-experience">` labeled "Explore Documentation". Right: a `CodeWindow filename="routes/web.php"` containing a hand-styled PHP snippet equivalent in spirit to:

```php
Route::get('/users', function () {
    return User::latest()->get();
});
```

with manually colored `<span>`s (e.g. keywords in `text-pink-400`, class names in `text-sky-300`, strings in `text-emerald-300`) — exact token boundaries are the builder's call.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `hero-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/hero-section.tsx
git commit -m "feat: add homepage hero section"
```

---

### Task 6: TrustSection

**Files:**

- Create: `resources/js/components/home/trust-section.tsx`

**Interfaces:**

- Consumes: `InfoCard` (Task 3, `compact`), `useReveal` (Task 1).
- Produces: `TrustSection(): JSX.Element` — used by Task 14.

- [ ] **Step 1: Implement `TrustSection`**

Heading "Everything you need to build modern PHP applications." above a responsive row/grid (stacks on mobile) of 4 `InfoCard compact` chips: "Elegant syntax", "Powerful APIs", "Built-in authentication", "Scalable architecture" (one short original one-line description each, pick one `lucide-react` icon per item, e.g. `Sparkles`, `Webhook`, `ShieldCheck`, `Layers`). Wrap the section content in the `useReveal` fade/slide-up treatment (`opacity-0 translate-y-4` → `opacity-100 translate-y-0` transition when `isVisible`, `motion-reduce:transform-none motion-reduce:opacity-100`).

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `trust-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/trust-section.tsx
git commit -m "feat: add homepage trust/stats section"
```

---

### Task 7: FeaturesSection

**Files:**

- Create: `resources/js/components/home/features-section.tsx`

**Interfaces:**

- Consumes: `InfoCard` (Task 3), `useReveal` (Task 1).
- Produces: `FeaturesSection(): JSX.Element`, rendering `<section id="features">` — used by Task 14.

- [ ] **Step 1: Implement `FeaturesSection`**

Heading "Everything you need. Nothing you don't." Grid (1 col mobile, 2 col `md`, 3 col `lg`) of 10 `InfoCard`s, one per: Routing (`Route` icon), Database & ORM (`Database`), Authentication (`ShieldCheck`), Queues & Jobs (`ListTodo`), APIs (`Webhook`), Testing (`FlaskConical`), Caching (`Zap`), Events (`Radio`), Notifications (`Bell`), Task Scheduling (`Clock`) — each with an original one-sentence description. Apply the same `useReveal` fade/slide-up treatment as Task 6.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `features-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/features-section.tsx
git commit -m "feat: add homepage features grid section"
```

---

### Task 8: DevExperienceSection

**Files:**

- Create: `resources/js/components/home/dev-experience-section.tsx`

**Interfaces:**

- Consumes: `CodeWindow` (Task 2), `useReveal` (Task 1).
- Produces: `DevExperienceSection(): JSX.Element`, rendering `<section id="dev-experience">` — used by Task 14.

- [ ] **Step 1: Implement `DevExperienceSection`**

Two-column split (stacked on mobile): left — `<h2>` "Designed for developers.", a short original paragraph on expressive syntax and productive tooling; right — a `CodeWindow` with an original PHP example distinct from the hero snippet (e.g. a simple Eloquent model/controller excerpt). Wrap the whole section in the `useReveal` treatment from Task 1/6.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `dev-experience-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/dev-experience-section.tsx
git commit -m "feat: add homepage developer-experience section"
```

---

### Task 9: EcosystemSection

**Files:**

- Create: `resources/js/components/home/ecosystem-section.tsx`

**Interfaces:**

- Consumes: `InfoCard` (Task 3), `useReveal` (Task 1).
- Produces: `EcosystemSection(): JSX.Element`, rendering `<section id="ecosystem">` — used by Task 14.

- [ ] **Step 1: Implement `EcosystemSection`**

Heading introducing the platform's ecosystem (original copy). Grid of 8 `InfoCard`s, one per: Framework (`Box`), ORM (`Database`), Queue (`ListTodo`), Authentication (`ShieldCheck`), API (`Webhook`), Testing (`FlaskConical`), Deployment (`Rocket`), Monitoring (`Activity`) — short original label/description each, no logos. Apply the same `useReveal` treatment.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `ecosystem-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/ecosystem-section.tsx
git commit -m "feat: add homepage ecosystem section"
```

---

### Task 10: CodeExampleSection

**Files:**

- Create: `resources/js/components/home/code-example-section.tsx`

**Interfaces:**

- Consumes: `CodeWindow` (Task 2), `useReveal` (Task 1).
- Produces: `CodeExampleSection(): JSX.Element` — used by Task 14.

- [ ] **Step 1: Implement `CodeExampleSection`**

Full-width dark section, heading "Simple code. Powerful applications." Single large `CodeWindow filename="routes/api.php"` containing a hand-styled, original PHP snippet in the spirit of:

```php
Route::post('/orders', function (Request $request) {
    $order = Order::create(
        $request->validate([
            'product_id' => ['required'],
            'quantity' => ['required', 'integer'],
        ])
    );

    return response()->json($order);
});
```

Wrap in the `useReveal` treatment.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `code-example-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/code-example-section.tsx
git commit -m "feat: add homepage full-width code example section"
```

---

### Task 11: CommunitySection

**Files:**

- Create: `resources/js/components/home/community-section.tsx`

**Interfaces:**

- Consumes: `InfoCard` (Task 3), `useReveal` (Task 1).
- Produces: `CommunitySection(): JSX.Element`, rendering `<section id="community">` — used by Task 14.

- [ ] **Step 1: Implement `CommunitySection`**

Heading inviting developers to get involved (original copy). Grid of 5 `InfoCard`s with `href="#"` placeholders: GitHub (`Github` icon), Documentation (`BookOpen`), Community (`Users`), Tutorials (`GraduationCap`), Blog (`Newspaper`) — short original description each. Apply the `useReveal` treatment.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `community-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/community-section.tsx
git commit -m "feat: add homepage community section"
```

---

### Task 12: FinalCtaSection

**Files:**

- Create: `resources/js/components/home/final-cta-section.tsx`

**Interfaces:**

- Consumes: `Button` from `@/components/ui/button`, `register`, `dashboard` from `@/routes`.
- Produces: `FinalCtaSection({ isAuthenticated }: { isAuthenticated: boolean }): JSX.Element` — used by Task 14.

- [ ] **Step 1: Implement `FinalCtaSection`**

Full-width section with a strong red/pink gradient glow background. `<h2>` "Start building something great.", supporting `<p>` "Build your next application with a framework designed around developer productivity.", two CTAs: primary `Button` → `isAuthenticated ? dashboard() : register()` labeled "Get Started"; secondary `Button asChild` wrapping `<a href="#dev-experience">` labeled "Read the Documentation".

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `final-cta-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/final-cta-section.tsx
git commit -m "feat: add homepage final CTA section"
```

---

### Task 13: SiteFooter

**Files:**

- Create: `resources/js/components/home/site-footer.tsx`

**Interfaces:**

- Consumes: `Github` icon (or similar) from `lucide-react`.
- Produces: `SiteFooter(): JSX.Element` — used by Task 14.

- [ ] **Step 1: Implement `SiteFooter`**

Dark footer, `border-t border-zinc-800`. Left: brand name (same as navbar) + one-line original description. Columns/links: Documentation (`#dev-experience`), Features (`#features`), Ecosystem (`#ecosystem`), Community (`#community`), GitHub (`#`, with `Github` icon) — each link with a visible `focus-visible:ring-2` state. Bottom row: `© {new Date().getFullYear()} <brand name>. All rights reserved.`

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no new errors from `site-footer.tsx`.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/home/site-footer.tsx
git commit -m "feat: add homepage footer"
```

---

### Task 14: Compose the homepage

**Files:**

- Modify: `resources/js/pages/welcome.tsx` (full rewrite of body; route/behavior unchanged)

**Interfaces:**

- Consumes: `SiteNavbar` (4), `HeroSection` (5), `TrustSection` (6), `FeaturesSection` (7), `DevExperienceSection` (8), `EcosystemSection` (9), `CodeExampleSection` (10), `CommunitySection` (11), `FinalCtaSection` (12), `SiteFooter` (13); `Head` and `usePage` from `@inertiajs/react` (as in the current file).

- [ ] **Step 1: Rewrite `Welcome`**

Keep `const { auth } = usePage().props;` and derive `const isAuthenticated = Boolean(auth.user);`. Render `<Head title="Build Modern PHP Applications">` with child `<meta name="description" content="..." />`, `<meta property="og:title" .../>`, `<meta property="og:description" .../>`, `<meta property="og:type" content="website" />` (original copy, per the spec's example title). Render a root `<div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">` containing, in order: `SiteNavbar`, `HeroSection`, `TrustSection`, `FeaturesSection`, `DevExperienceSection`, `EcosystemSection`, `CodeExampleSection`, `CommunitySection`, `FinalCtaSection`, `SiteFooter`, passing `isAuthenticated` to every component whose interface declares it.

- [ ] **Step 2: Verify types**

Run: `npm run types:check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add resources/js/pages/welcome.tsx
git commit -m "feat: compose new developer-focused homepage"
```

---

### Task 15: Final verification

**Files:**

- None (verification only).

- [ ] **Step 1: Full typecheck and format/lint**

Run: `npm run types:check && npm run check`
Expected: both pass with no errors (run `npm run check:fix` and re-run `npm run check` if it reports fixable issues).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds with no errors (confirms no "Unable to locate file in Vite manifest" issue per AGENTS.md).

- [ ] **Step 3: Serve and browse the homepage**

Start the app's existing dev workflow (e.g. `composer run dev` or `php artisan serve` + the built assets) and open `/` in a browser.

- [ ] **Step 4: Verify desktop layout**

At a desktop width (≥1280px): hero, all section grids, and footer render without overlap; nav is sticky; hovering feature/ecosystem/community cards shows the glow/lift transition.

- [ ] **Step 5: Verify mobile layout**

At 375px width: hamburger opens the `Sheet` drawer with all nav items and the auth-aware CTA(s); drawer closes on link click; no horizontal scroll anywhere on the page; code windows scroll horizontally within themselves instead of widening the page.

- [ ] **Step 6: Verify links and auth states**

Click every nav/footer anchor (`#features`, `#ecosystem`, `#community`, `#dev-experience`) and confirm it scrolls to the matching section `id`. Confirm the navbar/hero/final-CTA show "Log in" + "Get Started" when logged out, and a single "Dashboard" button when logged in (check both states).

- [ ] **Step 7: Verify console and reduced motion**

Check the browser console for errors. Enable `prefers-reduced-motion: reduce` (devtools emulation) and reload; confirm all sections render fully visible immediately with no fade/slide animation and no layout shift.

- [ ] **Step 8: Fix any issues found**

Address anything found in Steps 4–7 in the relevant component file(s), then re-run Steps 1–2 before re-verifying.

- [ ] **Step 9: Commit (only if Step 8 required changes)**

```bash
git add -A
git commit -m "fix: address homepage verification findings"
```
