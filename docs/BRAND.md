# Amaze Genius brand guide (website)

Sources: "Amaze Genius – Brand Identity" (jenomics.de blog, Feb 2025), Confluence DIKO "AG Webseite Brainstorming"
and "AG Colors" (2023), AmazeGenius DM Figma file (editor styles, light + dark tokens).

## Logo
- Icon: a small "a" built from a circle with a rotated quarter, filled with the full colour spectrum. Works in black/white too.
- Wordmark "amaze genius" in lowercase, based on Outfit Medium with custom letters. Never retype it in a font: use
  `public/media/ag-logo-light.webp` (white wordmark, for the dark site) or `ag-logo-dark.webp`, and `ag-icon.webp`.

## Colours (2025 identity)
| Token | Hex | Use |
|---|---|---|
| `--ag-blue` | #0041F6 | Kobaltblau, primary: buttons, active states |
| `--ag-orchid` | #7029BC | Dunkle Orchidee, secondary |
| `--ag-magenta` | #FF00D8 | Magenta, tertiary: dots, highlights |
| `--ag-coal` | #0D0D0D | Kohle, base of the dark surfaces (`--ag-bg` #09090C) |
| white | #FFFFFF | Reinweiß |

Text-safe tints on dark: blue `#6B93FF`, orchid `#B38AF0`, magenta `#FF6CEC`.
Spectrum (logo, ribbons, hairlines): #F81200 → #F3940C → #FFE000 → #8CFF06 → #00C3D9 → #0041F6 → #7029BC → #FF00D8.
The brand concentrates on the cool part (blue, violet, pink); the full spectrum is reserved for the logo, the ribbons
and small accents (kicker line, progress bar, footer hairline, one gradient word per hero/contact headline).

## Type
- Headlines: **Outfit** 500/600 (the logo font), tight tracking (-0.025 to -0.04em).
- Body and UI: **Wix Madefor Display** 400/500/600.
- Both OFL, self-hosted. (The 2023 Confluence fonts MintSans/Oxygen are superseded by the 2025 identity.)

## Signature elements
- **Ribbons**: hundreds of thin parallel lines forming twisting rainbow ribbons with lens-flare sparkles (2023 "network
  motive"), rendered live in WebGL. Hero: warm + cool + magenta ribbon crossing behind the headline. Contact: calmer
  blue/violet pair.
- **Dark glass cards** with a pointer-following rim light (blue → magenta).
- **Kicker**: uppercase 13px, letter-spacing .14em, short spectrum line in front.
- **Gradient words**: one word group per headline in the cool gradient (`.ag-grad`) or the flowing spectrum (`.ag-grad-s`).
- **Pills**: fully rounded buttons and chips.

## Motion
SDX family: lively but precise. Ease `cubic-bezier(.2,.7,.2,1)`, springs only for small pops. 220/520/900ms.
Everything respects `prefers-reduced-motion`.

## Voice
German, informal "du", "Kund:innen" (as on jenomics.de and the AG blog posts). B2B audience: shops, photo labs,
print houses. Only claim live editor functions.
