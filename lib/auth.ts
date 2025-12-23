// ibfa-portal/lib/auth.ts
export type InternalUser = {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  
  export type AuthData = {
    token: string;
    user: InternalUser;
  };
  
  const TOKEN_KEY = 'ibfa_internal_token';
  const USER_KEY = 'ibfa_internal_user';
  
  export function saveAuth(auth: AuthData) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  }
  
  export function loadAuth(): AuthData | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!token || !userRaw) return null;
    try {
      const user = JSON.parse(userRaw) as InternalUser;
      return { token, user };
    } catch {
      return null;
    }
  }
  
  export function clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  