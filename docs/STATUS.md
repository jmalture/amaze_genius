# Status (2026-10-16, afternoon)

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
- **References** band under the hero: dm Foto (link to foto.dm.de) and allcop, as text marks (no logos), approved by
  Honza; FAQ entry added.
- **Demo on GitHub Pages**: `.github/workflows/pages.yml` publishes every push to main to
  https://jmalture.github.io/amaze_genius/ (noindex, contact form inactive there).

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
- Can a customer (dm / Allcop) be named as a reference? Not named on the page yet.

## Open
- Domain (set `site` in `astro.config.mjs`), Hostinger Node.js app, SMTP env vars, MAIL_TO recipient.
- Impressum/Datenschutz currently link to jenomics.de; decide whether the AG site needs its own.
- EN version.
