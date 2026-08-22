import { create } from 'zustand';
import { authApi } from '../api/auth.api.js';
import { onUnauthorized, setAccessToken, toApiError } from '../api/client.js';

/**
 * Single source of truth for "who is signed in".
 *
 * The access token is deliberately NOT persisted to localStorage — it lives in
 * memory in api/client.js. On a page reload `bootstrap()` trades the httpOnly
 * refresh cookie for a fresh token, which is both safer and survives restarts.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  // 'idle' → nothing tried yet | 'loading' → restoring session | 'ready' → settled
  status: 'idle',
  submitting: false,
  error: null,

  isAuthenticated: () => Boolean(get().user),
  isAdmin: () => get().user?.role === 'admin',

  clearError: () => set({ error: null }),

  /** Applies a { user, accessToken } session payload. */
  applySession: ({ user, accessToken }) => {
    setAccessToken(accessToken);
    set({ user, status: 'ready', error: null });
  },

  /** Runs once on app mount — silently restores a session if the cookie is valid. */
  bootstrap: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const session = await authApi.refresh();
      get().applySession(session);
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'ready' });
    }
  },

  register: async (payload) => {
    set({ submitting: true, error: null });
    try {
      const session = await authApi.register(payload);
      get().applySession(session);
      return { ok: true };
    } catch (error) {
      const parsed = toApiError(error);
      set({ error: parsed });
      return { ok: false, error: parsed };
    } finally {
      set({ submitting: false });
    }
  },

  login: async (payload) => {
    set({ submitting: true, error: null });
    try {
      const session = await authApi.login(payload);
      get().applySession(session);
      return { ok: true };
    } catch (error) {
      const parsed = toApiError(error);
      set({ error: parsed });
      return { ok: false, error: parsed };
    } finally {
      set({ submitting: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, error: null, status: 'ready' });
    }
  },
}));

// A refresh that fails mid-session drops the user back to a signed-out state.
onUnauthorized(() => {
  useAuthStore.setState({ user: null, status: 'ready' });
});
