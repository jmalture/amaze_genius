# Status (2026-10-16)

## Done
- Homepage DE (`/`), dark theme, 10 sections: hero with WebGL ribbons, Sortiment (product cards + marquee),
  Rundgang (5 steps, sticky editor mockup driven by scroll), White Label (live theme switcher with fictional brands +
  light/dark), Mobil (phone → laptop project sync), Integration (3 paths, building blocks light up), Ablauf (4 steps,
  scroll-filled spectrum line), Für wen + "Gebaut von Jenomics", FAQ (with FAQPage JSON-LD), Kontakt (demo form →
  `/api/contact/`, second ribbon).
- Logo files from the official brand PNGs, favicon, OG image (hero render).
- Checked at 390 / 1440 px: no horizontal overflow, no console errors. Lighthouse locally: desktop 100/97/100/100,
  mobile perf 92 (uncompressed local server); a11y contrast + button-name findings fixed afterwards.

## Graphics still to come (placeholders today)
- **Rundgang** (`03-tour.astro`): the editor mockup is HTML/CSS. Replace `.ag-ed` per step with real dark-mode
  screenshots or short screen recordings. Source: Figma "AmazeGenius DM" → page "Fotobuch Desktop" → row
  "000 Dark mode" (5 frames). Needs export permission / access.
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
