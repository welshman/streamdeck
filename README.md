# StreamDeck

StreamDeck is a static, multi-platform livestream dashboard for watching **Twitch**, **Kick**, and **YouTube** streams side by side. It runs entirely in the browser — no backend, no database, no server-side code — and is designed to be hosted for free on **GitHub Pages**.

All data (saved streams, layout, theme, chat visibility, card collapse state, etc.) is stored in your browser's `localStorage`. Nothing is ever sent to a server.

> The "StreamDeck" name and logo are placeholders — rename freely in `index.html`, `Navbar.tsx`, and `package.json`.

Demo: https://welshman.github.io/streamdeck/

## Features

- Add streams by pasting a full URL or a bare channel name (Twitch/Kick) or video ID (YouTube).
- Paste multiple URLs at once to add several streams in one step.
- Automatic platform detection with clear, specific error messages for unsupported or ambiguous input (e.g. a bare word that could be a Twitch or Kick channel name is flagged rather than silently guessed).
- Six layout modes: auto grid, 2/3/4-column, picture-in-picture style, and single focus (a large focused stream with the others in a side rail).
- **One stream plays audio at a time in Single focus.** Side-rail streams are always muted; focusing a stream unmutes it and mutes the rest. Mute/unmute works for Twitch, Kick, and YouTube (Kick reloads its player when the mute state changes — see Limitations).
- Drag-and-drop reordering (mouse, touch, and keyboard-accessible).
- **Collapsible per-card controls**: each stream card's toolbar (favorite, feature, mute, chat, PiP, fullscreen, reload, open-original, hide, remove) can be collapsed down to just the drag handle, platform badge, and label. New streams default to collapsed. A global "collapse all / expand all" toggle lives in the top navbar next to Mute All.
- Hide streams without deleting them; unhide or permanently delete from the sidebar.
- Sidebar tabs for hidden streams, favorites (un-star right from the sidebar), and recently used streams (re-add, remove one, or clear all).
- Per-stream chat panel (Twitch only — see Limitations), mute/unmute, fullscreen, reload, and "open original" controls.
- Editable per-stream labels; the browser tab title shows how many streams are active.
- Dark mode (default), light mode, and "match system" theme.
- Import/export your whole configuration as JSON, or generate a shareable URL that encodes your stream list in the hash — no backend required.
- Safety nets: a confirmation before removing a stream or all streams, an error toast if saving fails, and a backup copy of saved data that can't be read before starting fresh.
- Keyboard shortcuts with an in-app cheat sheet (press `?`).
- Respects `prefers-reduced-motion` and is built with accessible, labeled controls throughout.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `A` | Add a stream |
| `S` | Toggle the sidebar |
| `F` | Toggle Single focus layout |
| `N` / `P` | Focus the next / previous stream (audio follows) |
| `1`–`9` | Focus the stream in that position |
| `C` | Collapse / expand all card controls |
| `R` | Reset layout |
| `T` | Cycle theme |
| `M` | Mute / unmute all |
| `?` | Show shortcuts |
| `Esc` | Close dialogs |

Shortcuts are ignored while typing in a text field or while a dialog is open.

## Important limitations (read before deploying)

StreamDeck is intentionally backend-free, which means a few things are **not** guaranteed:

- **No live/offline detection.** Twitch, Kick, and YouTube do not expose free, key-less "is this channel live" signals to static sites. A player that never finishes loading shows a "taking a while to load" message with a reload button after 20 seconds, but offline channels are not detected up front.
- **No live channel search.** There is no way to search Twitch/Kick/YouTube for channels by name from a static site without an API key. The search box in the "Add a stream" dialog only filters your own locally-saved recently-used streams.
- **Chat embedding is only available for Twitch.** Twitch provides a public, documented chat iframe. Kick does not currently offer an equivalent for third-party sites, and YouTube live chat requires an API key for reliable results — so both fall back to an "open chat in a new tab" button.
- **Kick audio is controlled through its URL.** Kick's player only honors the `autoplay` and `muted` URL parameters and ignores postMessage, so muting or unmuting a Kick stream reloads that player. Browsers (Firefox in particular) may also block un-muted autoplay until you interact with the page.
- **Picture-in-picture only works when the browser allows it.** Because platform players are cross-origin iframes, `requestPictureInPicture()` is attempted but may silently no-op depending on browser and platform support.
- **No scraping, DRM circumvention, or proxying.** All video is played back solely via each platform's official embeddable player (Twitch Player, Kick Player, YouTube IFrame API), exactly as documented by each platform.

## Tech stack

React + TypeScript + Vite + Tailwind CSS, with `@dnd-kit` for accessible drag-and-drop and `lucide-react` for icons. This stack was chosen over vanilla HTML/CSS/JS because:

- The app's state (streams, settings, per-card collapse state) is complex enough that React's component model and hooks meaningfully reduce bugs versus hand-rolled DOM diffing.
- TypeScript catches an entire class of "forgot to handle a platform" bugs at compile time (see the exhaustive `switch` statements in `embed.ts` and `StreamPlayer.tsx`).
- Vite produces a small, static `dist/` folder that deploys to GitHub Pages with zero server configuration.

## Project structure

```
src/
  types/stream.ts              Core TypeScript types, defaults, layout normalisation
  utils/
    streamParser.ts             URL/channel parsing & platform detection
    embed.ts                    Per-platform embed URL builders
    storage.ts                  localStorage persistence, migration + import/export
    shareLink.ts                URL-hash based config sharing
    id.ts, classNames.ts        Small helpers
    __tests__/                  Vitest unit tests
  hooks/
    useDashboardStore.ts        Central state store (streams, settings, toasts)
    useTheme.ts
    useKeyboardShortcuts.ts
  components/
    ErrorBoundary.tsx           Crash fallback
    players/                    Twitch/Kick/YouTube embeds + chat panel
    ui/                         Reusable primitives (Modal, Toast, Tooltip, ...)
    layout/                     Navbar, Sidebar, StatusBar
    stream/                     StreamCard (collapsible toolbar), StreamGrid (layout engine), ShareLinkModal
    modals/                     AddStream (with recent-stream search), Settings, Shortcuts dialogs
  App.tsx                       Wires everything together
  main.tsx                      Entry point
public/                         Static assets, 404.html SPA fallback, .nojekyll
.github/workflows/deploy.yml    CI: install → lint → test → build → deploy to Pages
```

## Install and run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

This starts a Vite dev server (default `http://localhost:5173`). Twitch embeds will use `parent=localhost`, which Twitch's player accepts for local development.

Other useful scripts:

```bash
npm run build      # Type-check and produce a production build in dist/
npm run preview    # Preview the production build locally
npm run lint        # ESLint
npm run format      # Prettier (writes changes)
npm run test        # Run unit tests once
npm run test:watch  # Run unit tests in watch mode
```

> **Note on `package-lock.json`:** this repository does not currently ship a committed lockfile, so `npm install` resolves the latest matching versions from `package.json` on every install (including in CI). Run `npm install` locally once and commit the generated `package-lock.json` if you want fully reproducible, pinned installs — you can then switch `.github/workflows/deploy.yml` back to `npm ci` with npm's built-in dependency cache for faster CI runs.

## Deploying to GitHub Pages

This repo ships with `.github/workflows/deploy.yml`, which builds and deploys automatically on every push to `main`.

1. In your repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main` (or run the workflow manually from the **Actions** tab).
3. The workflow sets `VITE_BASE_PATH=/<repo-name>/` automatically from `github.event.repository.name`, so `vite.config.ts` builds all asset URLs relative to `https://<your-username>.github.io/<repo-name>/`.
4. The same step patches `dist/404.html` so deep-link fallback redirects to the correct base path.

The workflow runs lint and tests before building; a failure in either stops the deploy and leaves the live site unchanged.

### Custom domain

If you're using a custom domain:

1. Add a `CNAME` file to the `public/` folder containing your domain (e.g. `stream.example.com`), so it's copied into `dist/` on build.
2. Configure the domain in **Settings → Pages → Custom domain**.
3. Set `VITE_BASE_PATH` to `/` (edit the `env:` line in `deploy.yml`) since a custom domain serves from the root, not a `/repo-name/` subpath.

### Local/preview environments

`getTwitchParentHost()` in `src/utils/embed.ts` reads `window.location.hostname` at runtime, so Twitch embeds automatically work correctly on `localhost`, `<username>.github.io`, any custom domain, and the Vite preview server. No manual configuration is required.

### Vite/Vitest configuration notes

`vite.config.ts` imports `defineConfig` from plain `vite` (not `vitest/config`) and only imports Vitest's `InlineConfig` as a *type*. This sidesteps a real issue in this dependency tree: `vitest` bundles its own nested copy of `vite`, and importing `defineConfig` from `vitest/config` resolves `Plugin`/`PluginOption` types against that nested copy, which then structurally conflicts with `@vitejs/plugin-react`'s top-level-`vite` `Plugin` type under `tsc -b`. If you upgrade `vite`, `vitest`, or `@vitejs/plugin-react` and see a `Plugin<any>` type-collision error, this is the likely cause — keep the type-only import pattern.

## Future improvements requiring optional APIs or a backend

These are intentionally **not** implemented, to keep the app fully static and key-less by default:

- **Real live/offline badges** via the Twitch Helix API, Kick's public API, and the YouTube Data API (all require API credentials and, realistically, a small proxy to avoid exposing secrets client-side).
- **Live channel search** across Twitch/Kick/YouTube.
- **YouTube Live Chat embedding** using the YouTube Data API's `liveChatId` lookup (requires an API key).
- **Channel avatars / titles** from each platform's public metadata endpoints.
- **Cross-device sync** of saved streams via a lightweight backend, while keeping local-only usage as the default.
- **Server-rendered OpenGraph previews** for shared configuration links.

Any of the above should remain strictly optional (feature-flagged) so the app continues to work with zero configuration.
