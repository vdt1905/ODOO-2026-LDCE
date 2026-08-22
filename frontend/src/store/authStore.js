import { create } from 'zustand';
import { authApi } from '../api/auth.api.js';
import { userApi } from '../api/user.api.js';
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

  /** Replaces the cached user after a profile or avatar change. */
  setUser: (user) => set({ user }),

  clearSession: () => {
    setAccessToken(null);
    set({ user: null, error: null, status: 'ready' });
  },

  /**
   * Uploads a profile photo for the signed-in user.
   * Returns { ok } rather than throwing so callers can treat a failed photo as
   * non-fatal — losing the avatar should never lose the account.
   */
  uploadAvatar: async (file, { onProgress } = {}) => {
    try {
      const user = await userApi.uploadAvatar(file, { onProgress });
      set({ user });
      return { ok: true, user };
    } catch (error) {
      return { ok: false, error: toApiError(error) };
    }
  },

  removeAvatar: async () => {
    try {
      const user = await userApi.removeAvatar();
      set({ user });
      return { ok: true, user };
    } catch (error) {
      return { ok: false, error: toApiError(error) };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clearSession();
    }
  },
}));

// A refresh that fails mid-session drops the user back to a signed-out state.
onUnauthorized(() => {
  useAuthStore.setState({ user: null, status: 'ready' });
});
