import { cn } from '../../lib/cn.js';

/**
 * The hero backdrop: a layered vector landscape (dawn sky → distant ridges →
 * rolling hills → wildflower meadow).
 *
 * It is drawn rather than photographed so the hero never flashes a broken image
 * or waits on a CDN. To swap in a real photograph later, replace the <svg> with
 * an <img> — nothing else in Hero.jsx depends on the internals.
 */

// Deterministic scatter — a seeded PRNG keeps the meadow identical on every
// render, so nothing shifts around between reloads.
const scatter = (count, seed, fn) => {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => fn(next, next, i));
};

const FLOWER_COLORS = ['#FFFFFF', '#F6D77A', '#E8845C', '#C9A0C4', '#FBF0D2'];

export const HeroScene = ({ className }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className={cn('size-full', className)}
    role="img"
    aria-label="Illustration of a sunlit valley with mountains and a wildflower meadow"
  >
    <defs>
      <linearGradient id="gt-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cfdae2" />
        <stop offset="38%" stopColor="#f0dcc8" />
        <stop offset="68%" stopColor="#f8d3ac" />
        <stop offset="100%" stopColor="#f3bb9b" />
      </linearGradient>

      <radialGradient id="gt-sunglow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.95" />
        <stop offset="55%" stopColor="#ffdca8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#ffd0a0" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="gt-ridge-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cbb7c2" />
        <stop offset="100%" stopColor="#dcc9c8" />
      </linearGradient>

      <linearGradient id="gt-ridge-mid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a2909e" />
        <stop offset="100%" stopColor="#bda3a1" />
      </linearGradient>

      <linearGradient id="gt-ridge-near" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c7f6a" />
        <stop offset="100%" stopColor="#9a9a72" />
      </linearGradient>

      <linearGradient id="gt-hill-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9aa86f" />
        <stop offset="100%" stopColor="#7e9264" />
      </linearGradient>

      <linearGradient id="gt-hill-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#74893f" />
        <stop offset="100%" stopColor="#5b7241" />
      </linearGradient>

      <linearGradient id="gt-meadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6f8a3f" />
        <stop offset="55%" stopColor="#557038" />
        <stop offset="100%" stopColor="#3d5530" />
      </linearGradient>

      <linearGradient id="gt-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe0bd" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffe0bd" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Sky + sun */}
    <rect width="1440" height="900" fill="url(#gt-sky)" />
    <circle cx="1010" cy="330" r="300" fill="url(#gt-sunglow)" />
    <circle cx="1010" cy="330" r="58" fill="#fff1cf" opacity="0.9" />

    {/* Distant ridge */}
    <path
      d="M0 452 L118 372 L196 424 L286 330 L372 408 L470 344 L560 420 L648 372 L742 436 L830 386 L928 442 L1030 380 L1128 440 L1226 392 L1330 446 L1440 402 L1440 560 L0 560 Z"
      fill="url(#gt-ridge-far)"
      opacity="0.85"
    />

    {/* Mid ridge with snow caps */}
    <path
      d="M0 512 L96 446 L176 494 L268 412 L356 486 L452 428 L548 500 L640 452 L742 508 L840 462 L944 516 L1046 460 L1150 512 L1256 466 L1360 518 L1440 480 L1440 620 L0 620 Z"
      fill="url(#gt-ridge-mid)"
    />
    <path d="M268 412 L296 438 L282 442 L302 456 L240 452 Z" fill="#f6e9e2" opacity="0.75" />
    <path d="M452 428 L478 452 L464 456 L484 470 L424 466 Z" fill="#f6e9e2" opacity="0.65" />
    <path d="M1046 460 L1070 482 L1058 486 L1076 498 L1020 494 Z" fill="#f6e9e2" opacity="0.6" />

    {/* Warm haze sitting in the valley */}
    <rect y="470" width="1440" height="150" fill="url(#gt-haze)" />

    {/* Near ridge */}
    <path
      d="M0 596 L120 540 L232 592 L348 534 L470 596 L590 546 L706 604 L828 552 L948 606 L1068 556 L1188 608 L1310 560 L1440 606 L1440 700 L0 700 Z"
      fill="url(#gt-ridge-near)"
    />

    {/* Rolling hills */}
    <path
      d="M0 656 C 190 596, 330 700, 520 654 C 700 610, 840 700, 1010 660 C 1180 620, 1320 690, 1440 650 L1440 780 L0 780 Z"
      fill="url(#gt-hill-back)"
    />
    <path
      d="M0 716 C 180 664, 360 754, 560 706 C 760 658, 920 748, 1120 708 C 1280 676, 1360 722, 1440 704 L1440 900 L0 900 Z"
      fill="url(#gt-hill-front)"
    />

    {/* Conifers along the back hill */}
    <g fill="#41562f" opacity="0.85">
      {scatter(26, 7717, (rx, ry, i) => {
        const x = 40 + i * 54 + rx() * 26;
        const baseY = 690 - Math.sin(i * 0.7) * 16;
        const h = 26 + ry() * 22;
        const w = h * 0.42;
        return (
          <path
            key={`tree-${i}`}
            d={`M${x} ${baseY - h} L${x + w} ${baseY} L${x - w} ${baseY} Z`}
          />
        );
      })}
    </g>

    {/* Cabin */}
    <g transform="translate(178 682)">
      <path d="M-42 6 L0 -30 L42 6 Z" fill="#8c5638" />
      <rect x="-32" y="4" width="64" height="40" rx="3" fill="#e8dccb" />
      <rect x="-9" y="18" width="18" height="26" rx="2" fill="#7d4f36" />
      <rect x="-26" y="14" width="12" height="12" rx="2" fill="#f7d99a" />
      <rect x="15" y="14" width="12" height="12" rx="2" fill="#f7d99a" />
    </g>

    {/* Wildflower meadow */}
    <path
      d="M0 762 C 200 726, 380 800, 600 764 C 820 728, 1000 802, 1200 766 C 1320 744, 1390 768, 1440 758 L1440 900 L0 900 Z"
      fill="url(#gt-meadow)"
    />

    <g>
      {scatter(190, 20260822, (rx, ry, i) => {
        const x = rx() * 1440;
        const t = ry();
        const y = 782 + t * 112;
        const r = 1.6 + t * 3.4;
        return (
          <circle
            key={`flower-${i}`}
            cx={x}
            cy={y}
            r={r}
            fill={FLOWER_COLORS[i % FLOWER_COLORS.length]}
            opacity={0.5 + t * 0.45}
          />
        );
      })}
    </g>

    {/* Grass tufts catching the light */}
    <g stroke="#87a24d" strokeWidth="2" strokeLinecap="round" opacity="0.55">
      {scatter(60, 991, (rx, ry, i) => {
        const x = rx() * 1440;
        const y = 806 + ry() * 90;
        return <path key={`grass-${i}`} d={`M${x} ${y} q ${i % 2 ? 6 : -6} -14 ${i % 2 ? 2 : -2} -22`} />;
      })}
    </g>
  </svg>
);
