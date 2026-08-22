import { Link } from 'react-router-dom';

import { cn } from '../../lib/cn.js';
import { ROUTES } from '../../lib/constants.js';

/**
 * The TRIPORA wordmark.
 *
 * The artwork in `public/` is a transparent PNG whose ink is pure white, which
 * makes the dark half free — it drops straight onto a hero photograph or a
 * forest panel. The light half is the awkward one: white on cream is invisible.
 * `brightness-0` is the fix. It maps every colour channel to zero and leaves the
 * alpha channel untouched, so the letterforms come back as near-black on paper
 * with their edges still anti-aliased. Recolouring in CSS rather than shipping a
 * second asset also means there is only one file to replace when the mark
 * changes.
 *
 * Width is left to `w-auto` and only the height is pinned, so the 3:1 artwork
 * can never be stretched by a parent. `width`/`height` are still declared on the
 * element to reserve the box before the image lands.
 */

const LOGO_SRC = '/odoo-logo-2.png';

export const Logo = ({ to = ROUTES.landing, className, tone = 'ink' }) => (
  <Link
    to={to}
    aria-label="TRIPORA — home"
    className={cn('group inline-flex items-center', className)}
  >
    <img
      src={LOGO_SRC}
      alt="TRIPORA"
      width={2172}
      height={724}
      decoding="async"
      className={cn(
        'h-7 w-auto transition-opacity group-hover:opacity-85 sm:h-8',
        tone === 'ink' && 'brightness-0'
      )}
    />
  </Link>
);
