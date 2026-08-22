import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { NAV_LINKS, ROUTES } from '../../lib/constants.js';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../ui/Button.jsx';
import { Logo } from '../ui/Logo.jsx';
import { Avatar } from '../ui/Avatar.jsx';

/**
 * Floating pill navigation.
 * `floating` lets it sit transparently over the hero and gain a solid
 * background once the user scrolls past it.
 */
export const Navbar = ({ floating = false }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!floating) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [floating]);

  const solid = !floating || scrolled;

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate(ROUTES.landing);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        floating ? 'pt-4 sm:pt-6' : 'pt-3'
      )}
    >
      <nav className="mx-auto max-w-6xl px-4">
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-full py-2 pr-2 pl-4 transition-all duration-300 sm:pl-5',
            solid
              ? 'border border-line bg-surface/90 shadow-pill backdrop-blur-xl'
              : 'border border-white/25 bg-white/10 backdrop-blur-md'
          )}
        >
          <Logo tone={solid ? 'ink' : 'light'} className="shrink-0" />

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                      solid
                        ? isActive
                          ? 'bg-canvas-deep text-ink-900'
                          : 'text-ink-500 hover:bg-canvas-deep hover:text-ink-900'
                        : isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/85 hover:bg-white/15 hover:text-white'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button to={ROUTES.trips} variant={solid ? 'ghost' : 'glass'} size="sm">
                  My trips
                </Button>
                <Link
                  to={ROUTES.profile}
                  className="flex items-center gap-2 rounded-full bg-ink-900 py-1.5 pr-4 pl-1.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-700"
                >
                  <Avatar user={user} />
                  {user.firstName}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className={cn(
                    'grid size-9 place-items-center rounded-full transition-colors',
                    solid
                      ? 'text-ink-500 hover:bg-canvas-deep hover:text-ink-900'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  )}
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Button to={ROUTES.register} variant={solid ? 'ghost' : 'glass'} size="sm">
                  Sign up
                </Button>
                <Button to={ROUTES.login} variant="dark" size="sm" className="px-6">
                  Login
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={cn(
              'grid size-10 place-items-center rounded-full transition-colors md:hidden',
              solid ? 'text-ink-900 hover:bg-canvas-deep' : 'text-white hover:bg-white/15'
            )}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile sheet */}
        {menuOpen && (
          <div className="mt-2 animate-fade-in rounded-3xl border border-line bg-surface p-3 shadow-lift md:hidden">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                        isActive ? 'bg-canvas-deep text-ink-900' : 'text-ink-700 hover:bg-canvas'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              {user ? (
                <>
                  <Button to={ROUTES.trips} variant="outline" fullWidth onClick={() => setMenuOpen(false)}>
                    My trips
                  </Button>
                  <Button variant="dark" fullWidth onClick={handleLogout}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button to={ROUTES.register} variant="outline" fullWidth onClick={() => setMenuOpen(false)}>
                    Create account
                  </Button>
                  <Button to={ROUTES.login} variant="dark" fullWidth onClick={() => setMenuOpen(false)}>
                    Login
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
