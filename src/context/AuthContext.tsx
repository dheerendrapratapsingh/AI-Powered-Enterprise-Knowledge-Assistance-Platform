import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'platform_admin' | 'org_admin' | 'employee';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string | null;
  orgName: string | null;
  avatarInitial: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Mock user directory — replace with real API call when backend is ready
// ---------------------------------------------------------------------------
const MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: 'u1',
    name: 'Sriram Kumar',
    email: 'sriram@nexaai.com',
    password: 'admin123',
    role: 'platform_admin',
    orgId: null,
    orgName: null,
    avatarInitial: 'S',
  },
  {
    id: 'u2',
    name: 'Himanvi Reddy',
    email: 'himanvi@acmecorp.com',
    password: 'admin123',
    role: 'org_admin',
    orgId: 'org_acme',
    orgName: 'Acme Corp',
    avatarInitial: 'H',
  },
  {
    id: 'u3',
    name: 'Dheerendra Singh',
    email: 'dheerendra@acmecorp.com',
    password: 'user123',
    role: 'employee',
    orgId: 'org_acme',
    orgName: 'Acme Corp',
    avatarInitial: 'D',
  },
  {
    id: 'u4',
    name: 'Narasimha Rao',
    email: 'narasimha@technova.com',
    password: 'user123',
    role: 'employee',
    orgId: 'org_technova',
    orgName: 'TechNova',
    avatarInitial: 'N',
  },
];

const SESSION_KEY = 'nexaai_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      return { ok: false, error: 'Invalid email or password.' };
    }

    const { password: _pw, ...authUser } = found;
    setUser(authUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
