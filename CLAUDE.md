# Project: Immersive Experience Design Taxonomy Chart

## Overview
3D radar chart library (Three.js) for the Immersive Experience Design Taxonomy.
Repo: `ImmersiveExperienceDesignTaxonomy/chart` (lowercase) on GitHub.

## Architecture
- **Library**: `src/` — ES module exporting `TaxonomyChart`, `ExperienceProfile`, `TAXONOMY_DIMENSIONS`
- **Demo**: `index.html` + `demo/main.js` — minimal full-viewport demo
- **Site**: `site/` — GitHub Pages Chart Builder (vanilla JS + Tailwind CDN)
- **Build output**: `docs/` — built by `npm run build:site`, served by GitHub Pages from `main` branch
- **Library build**: `dist/` — built by `npm run build` (Three.js externalized as peer dep)

## Key Files
- `vite.config.js` — library build (ES module, Three.js external)
- `vite.site.config.js` — site build (`base: '/chart/'`, `root: 'site'`, `outDir: '../docs'`)
- `site/app.js` — all Chart Builder logic (~400 lines, vanilla JS)
- `site/public/chart-preview-v2.png` — copied to `docs/` on build (README references it)

## Chart Library API
- `new TaxonomyChart(container, { showLabels, editable, onChange })`
- `addProfile(ExperienceProfile)` / `removeProfile(id)` / `clearProfiles()`
- `updateProfile(id, scores, color?)` — color param added to fix external state divergence
- `reorderProfiles(orderedIds)` — sets stack order (bottom-to-top Y positions)
- `setEditableProfile(id)` — designates which profile responds to click editing
- Scores format: `number[][]` — 10 arrays of active level numbers (1-4), non-cumulative

## Critical Patterns

### State divergence after updateProfile
`chart.updateProfile()` creates a NEW internal `ExperienceProfile` object. The app's
external `profiles` Map holds a stale reference after any updateProfile call. Always pass
color explicitly via the third param; don't rely on shared object references for color.

### setEditableProfile must be called explicitly
The chart doesn't auto-select a new editable profile when one is removed. App code must
call `chart.setEditableProfile(id)` whenever the active profile changes (including after
deletion fallback).

### profileOrder array
Map insertion order isn't reorderable. A separate `profileOrder: number[]` array tracks
sidebar rendering and chart stacking order. Must be kept in sync with the profiles Map
(push on add, splice on remove).

## Build & Deploy
- `npm run dev:site` — local dev server
- `npm run build:site` — builds to `docs/` with `/chart/` base path
- GitHub Pages: deploy from `main` branch, `/docs` folder
- Site URL: `immersiveexperiencedesigntaxonomy.github.io/chart/`
- **Do NOT run `npm run build` for testing** (per user preference in CLAUDE.md)

## Conventions
- Vanilla JS, no framework — site/app.js is a single module
- Tailwind via CDN (not installed), FontAwesome 6.5.1 via CDN
- Dark theme (`bg-gray-950`)
- Commit messages: imperative, concise, always include `Co-Authored-By: Claude Opus 4.6`
- Always rebuild site (`npm run build:site`) before committing if site files changed
- Repo name is lowercase `chart` (was renamed from `Chart`)
