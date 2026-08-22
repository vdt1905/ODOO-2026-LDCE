/**
 * Development-only theme switcher state.
 *
 * The whole type system resolves through four CSS variables on <html>
 * (see index.css). Writing them here repaints every heading and every body
 * string at once, with no rebuild and no React re-render — which is the point:
 * you can judge a pairing on a real screen full of real data instead of a
 * specimen sheet.
 *
 * REMOVE BEFORE THE FINAL BUILD. Delete this file, components/dev/, the
 * <DevSettings/> mount in App.jsx, and trim index.html's font link to the
 * pair that won.
 */

const STORAGE_KEY = 'gt.dev.theme';

/**
 * `display` faces are set at the weight and tracking that face actually needs —
 * Anton is a single-weight condensed face that wants slightly open tracking,
 * Playfair wants 800 and negative tracking. Storing them together is what
 * stops a swap from looking broken for reasons that are not the typeface's
 * fault.
 */
export const FONT_PAIRS = [
  {
    id: 'anton-serif',
    name: 'Anton / Source Serif',
    note: 'The mockup pairing — poster display over a warm serif.',
    display: '"Anton", "Oswald", ui-sans-serif, system-ui, sans-serif',
    body: '"Source Serif 4", Georgia, serif',
    weight: 400,
    tracking: '0.005em',
  },
  {
    id: 'anton-inter',
    name: 'Anton / Inter',
    note: 'Same display, neutral UI body. Reads more product, less magazine.',
    display: '"Anton", "Oswald", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    weight: 400,
    tracking: '0.005em',
  },
  {
    id: 'fraunces-inter',
    name: 'Fraunces / Inter',
    note: 'Editorial with personality in the headings, quiet everywhere else.',
    display: '"Fraunces", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.02em',
  },
  {
    id: 'playfair-inter',
    name: 'Playfair / Inter',
    note: 'High-contrast serif. Luxe, but fragile at small sizes.',
    display: '"Playfair Display", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    weight: 800,
    tracking: '-0.02em',
  },
  {
    id: 'oswald-serif',
    name: 'Oswald / Source Serif',
    note: 'Condensed but lighter than Anton — more headroom at large sizes.',
    display: '"Oswald", ui-sans-serif, system-ui, sans-serif',
    body: '"Source Serif 4", Georgia, serif',
    weight: 600,
    tracking: '0.01em',
  },
  {
    id: 'archivo-inter',
    name: 'Archivo / Inter',
    note: 'Grotesque display. Safest option, least characterful.',
    display: '"Archivo", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    weight: 800,
    tracking: '-0.02em',
  },
  {
    id: 'bitter-inter',
    name: 'Bitter / Inter',
    note: 'Slab headings. Sturdy, a little utilitarian.',
    display: '"Bitter", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.01em',
  },
  {
    id: 'outfit-inter',
    name: 'Outfit / Inter',
    note: 'What the app shipped with before the mockup landed.',
    display: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.02em',
  },
];

export const DEFAULTS = {
  pairId: 'anton-serif',
  /** Condensed display faces only look right uppercased; wide ones do not. */
  uppercase: true,
  /** Whole-page type scale, as a percentage of the browser default. */
  scale: 100,
};

export const readSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    // Private mode, blocked storage, or corrupt JSON — the defaults are fine.
    return { ...DEFAULTS };
  }
};

export const writeSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not being able to remember the choice is not worth breaking the page for.
  }
};

/** Pushes settings onto <html>. Safe to call on every change. */
export const applySettings = (settings) => {
  const pair = FONT_PAIRS.find((p) => p.id === settings.pairId) || FONT_PAIRS[0];
  const root = document.documentElement;

  root.style.setProperty('--gt-display', pair.display);
  root.style.setProperty('--gt-body', pair.body);
  root.style.setProperty('--gt-display-weight', String(pair.weight));
  root.style.setProperty('--gt-display-tracking', pair.tracking);

  // rem-based sizing means one number moves the entire scale together.
  root.style.fontSize = `${settings.scale}%`;
  root.dataset.gtUppercase = settings.uppercase ? 'on' : 'off';
};

/**
 * Called once before React mounts, so the first paint is already correct.
 * Without this the app flashes the default pairing on every reload.
 */
export const bootDevSettings = () => applySettings(readSettings());
