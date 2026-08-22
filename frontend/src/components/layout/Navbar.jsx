import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { NAV_LINKS, ROUTES } from '../../lib/constants.js';
import { useAuthStore } from '../../store/authStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Logo } from '../ui/Logo.jsx';

/**
 * The top bar, and deliberately nothing more than a bar.
 *
 * At the top of a page it has no background, no border and no blur — it is type
 * floating directly over whatever the page put underneath it. That is a product
 * decision, not an oversight: the earlier cream panel cut a hard line across
 * every masthead photograph.
 *
 * The whole problem that leaves is legibility, since the same bar has to sit
 * over a dark photo on one route and cream paper on the next. `floating` is the
 * only question the styling asks, and the page answers it by registering a
 * photographic header (see chrome.jsx):
 *
 *   · `floating` — the route opens on an image. The type is white and STAYS
 *     white at every scroll position. It used to flip to ink past 24px, which
 *     turned the wordmark black while it was still sitting on the hero
 *     photograph. Once scrolled, a soft dark blur slides in behind the bar so
 *     the white still holds after the page has moved on to cream.
 *   · not floating — a route with no photo at all. Ink type on paper, no fill,
 *     no border, no blur; white here would be invisible.
 *
 * Two things are opaque in every state, and both are shapes rather than bar
 * backgrounds: the primary pill (a button has to look like a button), and the
 * mobile dropdown, which is a separate sheet and needs its own ground.
 *
 * Because the bar is transparent at rest, it is also click-through: the header
 * and its nav are `pointer-events-none` and only the actual controls take
 * pointer events back, so the 80px strip does not swallow clicks on the page
 * beneath. The blur layer is a sibling with `pointer-events-none` for the same
 * reason.
 */

/** Keeps white type readable where the photograph goes bright. */
const PHOTO_SHADOW = 'drop-shadow-[0_1px_12px_rgba(10,16,11,0.55)]';

/** Poppins, not Anton — the links must not compete with the wordmark. */
const LINK_BASE =
  'relative inline-flex items-center py-2 text-[13.5px] font-semibold transition-colors ' +
  'after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:rounded-full ' +
  'after:transition-transform after:duration-300';

export const Navbar = ({ floating = false }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!floating) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [floating]);

  // The only question the styling asks. `scrolled` is deliberately NOT part of
  // it: an immersive route keeps white type all the way down, and the blur
  // below is what makes that safe. `menuOpen` is not part of it either — with
  // no panel behind the bar, ink over a photograph would be unreadable the
  // moment the menu opened.
  const onPhoto = floating;

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate(ROUTES.landing);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/* The blur is its own layer rather than a class on <header> so it can
          fade rather than snap, and so it stops at the bar's own height instead
          of covering the open mobile sheet below it. The tint is dark on
          purpose: it has to carry white type over a photograph AND over cream
          once the page has scrolled past the image. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-20 transition-opacity duration-300',
          'bg-ink-900/45 backdrop-blur-xl',
          floating && scrolled ? 'opacity-100' : 'opacity-0'
        )}
      />

      <nav
        aria-label="Main"
        className="shell pointer-events-none flex h-20 items-center justify-between gap-5"
      >
        <Logo
          tone={onPhoto ? 'light' : 'ink'}
          className={cn('pointer-events-auto shrink-0', onPhoto && PHOTO_SHADOW)}
        />

        <ul
          className={cn(
            'pointer-events-auto hidden items-center gap-7 lg:flex',
            onPhoto && PHOTO_SHADOW
          )}
        >
          {NAV_LINKS.map((link) => (
            <li key={`${link.label}-${link.to}`}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    LINK_BASE,
                    onPhoto
                      ? 'text-white/80 after:bg-white hover:text-white'
                      : 'text-ink-700 after:bg-brand-500 hover:text-ink-900',
                    isActive
                      ? cn('after:scale-x-100', onPhoto ? 'text-white' : 'text-ink-900')
                      : 'after:scale-x-0 hover:after:scale-x-100'
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            'pointer-events-auto hidden items-center gap-3 md:flex',
            onPhoto && PHOTO_SHADOW
          )}
        >
          {user ? (
            <>
              <Link
                to={ROUTES.trips}
                className={cn(
                  'text-[13.5px] font-semibold transition-colors',
                  onPhoto ? 'text-white/85 hover:text-white' : 'text-ink-700 hover:text-ink-900'
                )}
              >
                My trips
              </Link>
              <Link
                to={ROUTES.profile}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[13.5px] font-semibold transition-colors',
                  onPhoto
                    ? 'bg-white text-ink-900 hover:bg-brand-50'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                )}
              >
                <Avatar user={user} />
                {user.firstName}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className={cn(
                  'grid size-9 cursor-pointer place-items-center rounded-full transition-colors',
                  onPhoto
                    ? 'text-white/85 hover:bg-white/15 hover:text-white'
                    : 'text-ink-500 hover:bg-canvas-deep hover:text-ink-900'
                )}
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className={cn(
                  'px-2 py-2 text-[13.5px] font-semibold transition-colors',
                  onPhoto ? 'text-white/85 hover:text-white' : 'text-ink-700 hover:text-ink-900'
                )}
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.register}
                className={cn(
                  'inline-flex h-10 items-center rounded-full px-5 text-[13.5px] font-semibold transition-colors',
                  onPhoto
                    ? 'bg-white text-ink-900 hover:bg-brand-50'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                )}
              >
                Pack your bags
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className={cn(
            'pointer-events-auto grid size-10 cursor-pointer place-items-center rounded-full transition-colors md:hidden',
            onPhoto
              ? cn('text-white hover:bg-white/15', PHOTO_SHADOW)
              : 'text-ink-900 hover:bg-canvas-deep'
          )}
        >
          {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </nav>

      {/* A separate sheet, not part of the bar — this one needs a real ground
          under it or it is unreadable over a photograph. */}
      {menuOpen && (
        <div className="pointer-events-auto border-b border-line bg-canvas text-ink-900 md:hidden">
          <div className="shell py-4">
            <ul className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <li key={`${link.label}-${link.to}`}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-600'
                          : 'text-ink-700 hover:bg-canvas-deep hover:text-ink-900'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
              {user ? (
                <>
                  <Link
                    to={ROUTES.profile}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong text-sm font-semibold text-ink-900 transition-colors hover:bg-canvas-deep"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.login}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong text-sm font-semibold text-ink-900 transition-colors hover:bg-canvas-deep"
                  >
                    Sign in
                  </Link>
                  <Link
                    to={ROUTES.register}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Pack your bags
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
