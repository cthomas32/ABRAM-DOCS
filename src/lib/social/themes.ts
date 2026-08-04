/**
 * Colour treatments for social images.
 *
 * Satori renders a radial gradient with a visible hard edge, so every
 * ambient wash here is linear. Each theme is a complete palette rather
 * than a tint on top of one base, because a light card needs different
 * text tiers than a dark one, not the same tiers lightened.
 */

export type SocialThemeId = "midnight" | "laser" | "ember" | "steel" | "cream";

export interface SocialTheme {
  id: SocialThemeId;
  label: string;
  /** Page background */
  background: string;
  /** Ambient wash painted across the top of the card */
  wash: string;
  /** Short rule in the top-left corner, echoing the laser detail on the site */
  rule: string;
  /** Eyebrow, quote marks, stat figures */
  accent: string;
  /** Headline */
  text: string;
  /** Second headline line and body copy */
  secondary: string;
  /** Footer, attribution, captions */
  muted: string;
  /** Hairlines and list bullets */
  hairline: string;
  /** Fill behind a drawn app panel on a product card */
  panel: string;
  panelBorder: string;
  /** The frame behind the app window, a step darker than the panel */
  appShell: string;
  /** The app's main content panel, the one with the rounded top-left corner */
  appPanel: string;
  /** A raised card or tile inside the main panel */
  appTile: string;
  /** Which ink of the brand mark and lockup sits correctly on this card */
  ink: "cream" | "black";
  /** Swatch shown in the studio picker */
  swatch: string;
}

export const SOCIAL_THEMES: Record<SocialThemeId, SocialTheme> = {
  midnight: {
    id: "midnight",
    label: "Midnight",
    background: "#0A0A0A",
    wash: "linear-gradient(160deg, rgba(142,202,255,0.18) 0%, rgba(59,130,246,0.06) 22%, rgba(10,10,10,0) 46%)",
    rule: "linear-gradient(90deg, #8ECAFF 0%, rgba(59,130,246,0) 100%)",
    accent: "#8ECAFF",
    text: "#FFFFFF",
    secondary: "#A1A1AA",
    muted: "#71717A",
    hairline: "rgba(255,255,255,0.10)",
    panel: "rgba(255,255,255,0.03)",
    panelBorder: "rgba(255,255,255,0.09)",
    appShell: "#050505",
    appPanel: "#0E0E10",
    appTile: "rgba(255,255,255,0.07)",
    ink: "cream",
    swatch: "#0A0A0A",
  },
  laser: {
    id: "laser",
    label: "Laser",
    background: "#050B14",
    wash: "linear-gradient(150deg, rgba(59,130,246,0.40) 0%, rgba(142,202,255,0.12) 20%, rgba(5,11,20,0) 44%)",
    rule: "linear-gradient(90deg, #FFFFFF 0%, rgba(142,202,255,0) 100%)",
    accent: "#8ECAFF",
    text: "#FFFFFF",
    secondary: "#BFDBFE",
    muted: "#7DA2C9",
    hairline: "rgba(142,202,255,0.18)",
    panel: "rgba(8,18,34,0.55)",
    panelBorder: "rgba(142,202,255,0.16)",
    appShell: "#02070E",
    appPanel: "#0A1524",
    appTile: "rgba(142,202,255,0.10)",
    ink: "cream",
    swatch: "#0B1B33",
  },
  ember: {
    id: "ember",
    label: "Ember",
    background: "#0A0A0A",
    wash: "linear-gradient(155deg, rgba(206,28,28,0.34) 0%, rgba(206,28,28,0.08) 20%, rgba(10,10,10,0) 44%)",
    rule: "linear-gradient(90deg, #CE1C1C 0%, rgba(206,28,28,0) 100%)",
    accent: "#FF8A8A",
    text: "#FFFFFF",
    secondary: "#D4D4D8",
    muted: "#8A8A8F",
    hairline: "rgba(255,255,255,0.10)",
    panel: "rgba(255,255,255,0.03)",
    panelBorder: "rgba(255,255,255,0.09)",
    appShell: "#050505",
    appPanel: "#130E0E",
    appTile: "rgba(255,255,255,0.07)",
    ink: "cream",
    swatch: "#2A0B0B",
  },
  steel: {
    id: "steel",
    label: "Steel",
    background: "#111113",
    wash: "linear-gradient(165deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 22%, rgba(17,17,19,0) 46%)",
    rule: "linear-gradient(90deg, #FAFAF9 0%, rgba(250,250,249,0) 100%)",
    accent: "#D4D4D8",
    text: "#FFFFFF",
    secondary: "#A1A1AA",
    muted: "#71717A",
    hairline: "rgba(255,255,255,0.10)",
    panel: "rgba(255,255,255,0.04)",
    panelBorder: "rgba(255,255,255,0.10)",
    appShell: "#08080A",
    appPanel: "#16161A",
    appTile: "rgba(255,255,255,0.07)",
    ink: "cream",
    swatch: "#111113",
  },
  cream: {
    id: "cream",
    label: "Cream",
    background: "#FAFAF9",
    wash: "linear-gradient(160deg, rgba(59,130,246,0.18) 0%, rgba(142,202,255,0.07) 22%, rgba(250,250,249,0) 46%)",
    rule: "linear-gradient(90deg, #0A0A0A 0%, rgba(10,10,10,0) 100%)",
    accent: "#1D4ED8",
    text: "#0A0A0A",
    secondary: "#3F3F46",
    muted: "#71717A",
    hairline: "rgba(10,10,10,0.12)",
    panel: "rgba(255,255,255,0.75)",
    panelBorder: "rgba(10,10,10,0.10)",
    appShell: "#E6E3DC",
    appPanel: "#FFFFFF",
    appTile: "rgba(10,10,10,0.06)",
    ink: "black",
    swatch: "#FAFAF9",
  },
};

export const SOCIAL_THEME_IDS = Object.keys(SOCIAL_THEMES) as SocialThemeId[];

export const DEFAULT_THEME: SocialThemeId = "midnight";

export function getTheme(id: string | null | undefined): SocialTheme {
  return SOCIAL_THEMES[(id as SocialThemeId) ?? DEFAULT_THEME] ?? SOCIAL_THEMES[DEFAULT_THEME];
}
