/**
 * Ribbon shapes ("poses") traced from the 2023 network motifs (Confluence DIKO "AG Webseite Brainstorming").
 * Each point: [x, y, z, w, twist, hue] (see ribbons.ts). x/y: -1…1 is the visible area, the ends run off-screen.
 * Hues may run past 1; only the fraction counts (0 red, .08 orange, .15 yellow, .25 lime, .33 green, .5 cyan,
 * .63 blue, .75 violet, .85 magenta).
 *
 * Debug a single pose: open the page with ?pose=0 … ?pose=5 (shows that pose, no animation).
 */
import type { Pose } from './ribbons';

/** Hero mockup: red from the left, dipping under the headline through yellow/green, rising steeply to violet. */
const spectrum: Pose = [
  [-1.25, -0.02, 0.0, 0.22, 0.3, 0.98],
  [-0.75, 0.04, 0.1, 0.26, 0.75, 1.06],
  [-0.35, -0.14, 0.25, 0.2, 1.35, 1.14],
  [0.05, -0.42, 0.15, 0.13, 1.75, 1.26],
  [0.42, -0.3, -0.1, 0.2, 2.5, 1.46],
  [0.72, 0.25, -0.25, 0.3, 3.0, 1.63],
  [1.02, 1.2, -0.35, 0.36, 3.45, 1.84],
];

/** Motif 1: yellow curl at the top left, flowing down to the right through orange and red to pink, many turns. */
const curl: Pose = [
  [-1.02, 0.3, 0.0, 0.07, 0.0, 0.16],
  [-0.92, 0.88, 0.25, 0.16, 1.3, 0.15],
  [-0.7, 0.42, 0.35, 0.15, 2.3, 0.12],
  [-0.32, 0.14, 0.15, 0.12, 3.1, 0.07],
  [0.12, 0.0, 0.0, 0.1, 4.1, 0.02],
  [0.58, -0.38, -0.15, 0.13, 5.1, -0.04],
  [1.25, -0.22, -0.3, 0.17, 6.2, -0.1],
];

/** Motif 2: broad green-to-yellow arc with one soft twist in the middle. */
const arc: Pose = [
  [-1.25, -0.38, 0.0, 0.3, 0.2, 0.31],
  [-0.7, 0.04, 0.1, 0.27, 0.6, 0.28],
  [-0.25, 0.34, 0.25, 0.14, 1.4, 0.24],
  [0.15, 0.42, 0.25, 0.09, 1.72, 0.21],
  [0.55, 0.3, 0.1, 0.2, 2.25, 0.18],
  [0.9, 0.04, 0.0, 0.27, 2.85, 0.16],
  [1.25, -0.28, -0.1, 0.2, 3.15, 0.15],
];

/** Motif 3: magenta on the left, a tight twist in the centre, flaring wide into blue on the right. */
const wave: Pose = [
  [-1.25, 0.18, 0.0, 0.14, 0.4, 0.86],
  [-0.75, -0.04, 0.1, 0.18, 0.95, 0.82],
  [-0.35, -0.32, 0.25, 0.12, 1.55, 0.78],
  [0.05, -0.2, 0.15, 0.05, 3.15, 0.73],
  [0.45, 0.02, 0.0, 0.21, 3.55, 0.69],
  [0.8, 0.27, -0.15, 0.33, 3.85, 0.65],
  [1.25, 0.48, -0.3, 0.4, 4.15, 0.62],
];

/** Motif 4: rainbow S, thin and low on the left, a pinch in the dip, fanning wide as it shoots up to the right. */
const rainbowS: Pose = [
  [-1.25, -0.1, 0.0, 0.06, 0.1, 0.99],
  [-0.75, -0.08, 0.0, 0.1, 0.4, 1.08],
  [-0.35, -0.45, 0.15, 0.19, 1.2, 1.18],
  [0.0, -0.42, 0.3, 0.07, 1.62, 1.33],
  [0.3, -0.1, 0.15, 0.12, 2.6, 1.5],
  [0.55, 0.55, -0.15, 0.33, 3.1, 1.66],
  [0.95, 0.9, -0.35, 0.44, 3.4, 1.82],
];

/** Motif 5: the vertical spiral, a narrow band twisting down the right side. */
const spiral: Pose = [
  [0.4, 1.3, 0.0, 0.11, 0.0, 0.98],
  [0.46, 0.78, 0.15, 0.11, 0.9, 1.05],
  [0.52, 0.34, 0.3, 0.09, 1.85, 1.14],
  [0.6, -0.02, 0.3, 0.04, 2.95, 1.3],
  [0.68, -0.36, 0.15, 0.09, 3.65, 1.5],
  [0.78, -0.78, 0.0, 0.13, 4.25, 1.7],
  [0.94, -1.3, -0.1, 0.15, 4.85, 1.85],
];

/** Same shape, hue numbered one or more turns further round the colour wheel (looks identical). */
const lift = (pose: Pose, turns: number): Pose => pose.map(([x, y, z, w, tw, h]) => [x, y, z, w, tw, h + turns]);

/**
 * The hero sequence: starts (and freezes for PageSpeed / reduced motion) on the hero-mockup spectrum wave.
 * Colours blend numerically from pose to pose, so the hue numbering decides the path round the colour wheel. The
 * turns below are chosen so every point takes the shortest consistent path and none winds round the wheel over a
 * loop (otherwise neighbouring points drift apart and a full rainbow pops up between them). Re-check with a script
 * if you change hues: for each point, |hue(next pose) - hue(pose)| should stay well under 1.
 */
export const HERO_POSES: Pose[] = [spectrum, lift(curl, 1), lift(arc, 1), lift(wave, 1), rainbowS, spiral];

/** Contact section: calmer, cool colours only. */
export const CONTACT_POSES: Pose[] = [
  [
    [-1.25, -0.55, 0.0, 0.2, 0.4, 0.62],
    [-0.75, -0.42, 0.1, 0.24, 0.9, 0.66],
    [-0.3, -0.62, 0.2, 0.14, 1.6, 0.7],
    [0.1, -0.5, 0.2, 0.08, 2.2, 0.74],
    [0.5, -0.3, 0.05, 0.2, 2.8, 0.78],
    [0.85, -0.45, -0.1, 0.26, 3.3, 0.82],
    [1.25, -0.6, -0.2, 0.22, 3.7, 0.86],
  ],
  [
    [-1.25, -0.4, 0.0, 0.14, 0.2, 0.86],
    [-0.75, -0.6, 0.1, 0.18, 1.1, 0.8],
    [-0.3, -0.48, 0.25, 0.22, 1.7, 0.75],
    [0.1, -0.7, 0.2, 0.12, 2.6, 0.7],
    [0.5, -0.55, 0.05, 0.08, 3.2, 0.66],
    [0.85, -0.35, -0.1, 0.2, 3.6, 0.63],
    [1.25, -0.5, -0.2, 0.26, 4.0, 0.6],
  ],
];
