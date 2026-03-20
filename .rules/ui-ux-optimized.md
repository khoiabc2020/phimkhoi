# PhimKhoi: Comprehensive System Rules & Architectural Guide

This document is the "source of truth" for the PhimKhoi project. It covers design standards, mechanical patterns, API integrations, and deployment workflows. Adhering to these rules is mandatory for maintaining the project's premium quality.

---

## 1. Design System: "Flat & Premium"

### Core Visuals
- **Primary Color**: `#8FA7C5` (Blue-Gray) — used for primary buttons, active highlights, and player theme.
- **Backgrounds**: 
  - Main Body: `#0a0a0a`
  - Cards/Containers: `#111117` or `#0b101a`
- **Rounding Strategy**:
  - Buttons & Pills: `rounded-full`
  - Movie Cards: `rounded-[10px]`
  - Layout Sections: `rounded-xl` or `rounded-2xl`
- **Strict Prohibition**: No `glow-pulse`, `text-glow`, or colored/inner shadows. All interactive elements must be "flat" with subtle scaling (`active:scale-95`) or light background shifts (`hover:bg-white/10`).

### Component Patterns
- **Movie Cards (`MovieCard.tsx`)**:
  - Image Fitting: Always use `object-cover`.
  - Content: Title, subtitle (original name), year, and quality badge.
  - Hover: Use `ring-1 ring-white/5` static and `ring-2 ring-primary/60` on hover.
- **Header (`Header.tsx`)**:
  - Responsive: Desktop (full search + auth), Mobile (hamburger menu).
  - Login: Pill-shaped, background `#263243`, text `#d8e3f2`, including `LogIn` icon.
- **Watch Page**:
  - Server Tabs: Grouped and cleaned via `parseServerLabel`.
  - Episode Buttons: Flat design; active state is dark navy (`#263243`) with brand-colored text.

---

## 2. Technical Architecture & Data Logic

### Image Handling & Optimization
- **Proxying**: Images from external sources (KKPhim, OPhim, NguonC) must pass through `/api/img-proxy` to enable VPS/Cloudflare caching.
- **Orientation Detection (`utils.ts`)**: 
  - Always use `detectOrientation(url)` to determine if a source image is portrait or landscape.
  - Portrait images go into `poster_url`.
  - Landscape images (backdrops/banners) go into `thumb_url`.
- **TMDB Enrichment**:
  - Always attempt to match movies with TMDB for high-quality backdrops and vote averages.
  - Search Strategy: Check both `movie` and `tv` endpoints. Use Similarity check (threshold ~0.5) and Year tolerance (+/- 3 years).

### API Integration (`api.ts`)
- **Main Provider**: PhimAPI / KKPhim as the primary source.
- **Multi-Source Logic**: `mergeMovieImages` merges assets from OPhim and NguonC if the primary source is missing specific images.
- **Normalization**: All external items must be mapped to the `Movie` interface before reaching the UI.
- **Server Filtering**: Clean server names using `parseServerLabel` to remove noise like "Vietsub", "TM", etc.

### Global State & Context
- **Favorites & Watchlist**: Managed via specific Context Providers (`src/context`). Sync to local storage or DB (if logged in).
- **Session Management**: NextAuth handles user authentication (Admin, Member).

---

## 3. Workflow & Performance Standards

### Next.js Best Practices
- **Server Components**: Use by default for SEO (Detail pages, Lists).
- **Streaming**: Wrap heavy rows (e.g., `TopTrendingTabs`) in `Suspense` with skeletons.
- **Caching**: 
  - Home data: `cache()` for 20 minutes on the server.
  - Detail pages: `revalidate: 3600` (1 hour).
- **SEO**: Each page must have a unique `title` and `meta` description. Include `BreadcrumbJsonLd` on detail pages.

### Deployment (VPS)
- **Primary Tool**: `.\scripts\windows\sync_vps.bat`.
- **Procedure**:
  1. `git add .` + `git commit`
  2. `git push` to GitHub
  3. Remote SSH: `git pull`
  4. `npm install` + `next build`
  5. PM2 restart: `pm2 restart phimkhoi`
- **Verification**: Post-deployment checks must be done manually on production as Cloudflare blocks automated bots.

---

## 4. Coding Standards (Clean Code)
- Avoid "magic numbers" — use constants (e.g., `ROW_LIMIT`, `API_URL`).
- Use `cn()` utility for conditional Tailwind classes.
- Prefer functional components and hooks.
- Document complex logic with concise comments.

---
**Last Updated**: March 2026
