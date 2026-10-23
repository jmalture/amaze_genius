# Status (2026-10-19)

## Done
- Homepage DE (`/`), dark theme, 10 sections: hero with WebGL ribbons, Sortiment (product cards + marquee),
  Rundgang (5 steps, sticky editor mockup driven by scroll), White Label (live theme switcher with fictional brands +
  light/dark), Mobil (phone → laptop project sync), Integration (3 paths, building blocks light up), Ablauf (4 steps,
  scroll-filled spectrum line), Für wen + "Gebaut von Jenomics", FAQ (with FAQPage JSON-LD), Kontakt (demo form →
  `/api/contact/`, second ribbon).
- Logo files from the official brand PNGs, favicon, OG image (hero render).
- Checked at 390 / 1440 px: no horizontal overflow, no console errors. Lighthouse locally: desktop 100/97/100/100,
  mobile perf 92 (uncompressed local server); a11y contrast + button-name findings fixed afterwards.

## Update 16.10. afternoon
- **Hero ribbon v2** (`src/scripts/ribbons.ts` + `ribbon-poses.ts`): one big ribbon morphing through the six 2023
  motifs (hero spectrum wave, yellow curl, green arc, magenta twist, rainbow S, vertical spiral), rubbery staggered
  morphs, pinch twists, depth; a faint mirrored echo behind. `?pose=0…5` shows a single pose for tuning.
- **Rundgang** now shows the real dark-mode screens from Figma (Fotobuch Desktop → "000 Dark mode", dm branding,
  approved by Honza). Step 4 narrows the window into a tablet. Source PNG on Honza's PC:
  `Documents\Jenomics\amaze-genius-assets\figma\fotobuch-desktop-dark.png`.
- **References** band under the hero: allcop (allcop-store.de) first, then i-Port (i-port.de), as text marks
  (no logos), per Honza; dm Foto removed as a named reference (the Rundgang screens still show the dm branding).
  FAQ entry added.
- **Demo on GitHub Pages**: `.github/workflows/pages.yml` publishes every push to main to
  https://jmalture.github.io/amaze_genius/ (noindex, contact form inactive there).

## Update 16.10. 15:30: loading
- Hero headline no longer clips the descenders (g, comma) of the gradient word.
- References: allcop (allcop-store.de) first, i-Port (i-port.de) second.
- Loading: ribbon poster image from the first paint, WebGL deferred to idle after load with non-blocking shader
  compile, ~3× cheaper vertex shader (analytic tangent), no WebGL at all on software renderers.
  `server.mjs` adds Brotli/gzip + cache headers (`npm start`). Lighthouse local: desktop 100 (TBT 0 ms),
  mobile 99 (TBT 30 ms), was 86 / TBT 320 ms desktop on PageSpeed.
- Posters: rendered from `/?pose=0` at 1600×900 (landscape) and 390×844 @2x → 600×1298 (portrait), WebP q62.

## Update 19.10.: ribbons stay horizontal
- Hero poses flattened (spectrum, curl, rainbow S; the spiral is now a horizontal coil, not a vertical one), band
  ends narrower so the two strands don't swing upright. Steepest segment on 16:9 went from 84° to 32° (target: no
  segment steeper than ~35°); 21:9 26°, 4:3 40°. Portrait screens squeeze the shape vertically (factor 0.42, was
  0.62), steepest 46°. Posters re-rendered.

## Update 19.10.: mobile pass
- Checked at 360 / 390 / 430 px (touch emulation) and 768 px.
- Rundgang on phones (≤700px): swipeable cards instead of the sticky window. Each card shows a zoomed crop of the
  real screen (zoom + crop corner per step in `03-tour.astro` → `shots`) above the step text; dots follow the swipe
  and jump on tap. Tablet and desktop unchanged.
- Pinned "Demo anfragen" pill at the bottom on phones once the hero is out of view; hidden over the contact form,
  the footer and the open menu.
- Mobil: text before the devices. White Label points and "Für wen" cards: icon left, compact. Jenomics stats in one
  row. References: description no longer wraps. Hero a bit tighter. Section spacing on phones 64 px (was 80).
- Tap targets: footer links 40 px rows, Light/Dark toggle 44 px, carousel dots 36×44.
- Page at 360 px: 12,400 px tall (was 14,900). Lighthouse mobile (server.mjs): 99 / 100 / 100 / 100, TBT 10–30 ms.

## Update 19.10.: Ablauf plays 1 → 4
- When the steps come into view the line draws from node to node (1.1 s per step) and each node lights up with its
  title and text as the line reaches it; plays once. Works in the row (desktop) and the column (≤860px), all
  browsers (no scroll-timeline needed). Reduced motion / no JS: everything shown at once.

## Update 23.10.: no "dm" in the editor title
- Rundgang screens: the editor title "dm-Fotobuch 30x30" now reads "mein-Fotobuch 30x30" (steps 1–4, both sizes).
  Edited in the lossless Figma exports (original pixels of "m" and "-Fotobuch 30x30" kept, "ein" drawn in Fira
  Sans to match), then re-exported as WebP q80 with the same crops. The Vorschau screen never showed it.

## Graphics still to come
- **White Label** (`04-brand.astro`): mini editor is HTML/CSS on purpose (it re-themes live). Keep, or swap the
  calendar for a real render.
- **Mobil** (`05-mobile.astro`): phone + laptop are CSS. Figma has "Wandkalender A4 Mobile" / "Fotobuch Mobile" screens.
- **Sortiment** (`02-range.astro`): product illustrations are inline SVG; swap for product renders if wanted.

## Claims to confirm (Honza / Ben)
- Product list: Fotobücher, Kalender, Tassen, Puzzles, Drucke (from the AG blog posts). Anything to add (Fotoaufsteller,
  Poster)?
- Editor functions shown in the Rundgang: photo upload, layouts per page/spread, backgrounds (einfarbig, Aquarell),
  cliparts, photo effects (Schwarz/Weiß, Sepia, Invertiert, Technicolor, Leuchtkraft), Transparenz, Spiegeln, Rahmen,
  page count, preview, save, price + cart. Seen in the live editor and the 2025 blog mockup.
- Theming = editor colours + light/dark mode (blog). Logo in the editor header is not claimed.
- Save in Kundenkonto and continue on another device (blog).
- Integration paths and "Jenomics übernimmt Personalisierung und Produktionsanbindung" (blog).
- Ablauf steps (Kennenlernen → Personalisieren → Anbinden → Live) are a plausible process, not from a source.
- "Nachfolger von IKONA" (blog: IKONA is the current predecessor).

## Open
- Domain (set `site` in `astro.config.mjs`), Hostinger Node.js app, SMTP env vars, MAIL_TO recipient.
- Impressum/Datenschutz currently link to jenomics.de; decide whether the AG site needs its own.
- EN version.
