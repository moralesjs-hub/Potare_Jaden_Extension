import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserResponse } from "../types/user";
import { getCurrentUser, login, logout, signup } from "../lib/auth";
import { getUserById } from "../services/user_services";

type SignupValues = {
  username: string;
  email: string;
  password: string;
};

type LoginValues = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: UserResponse | null;
  loading: boolean;
  signIn: (values: LoginValues) => Promise<void>;
  signUp: (values: SignupValues) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: async (values: LoginValues) => {
        const loggedInUser = await login(values);
        setUser(loggedInUser);
      },
      signUp: async (values: SignupValues) => {
        const newUser = await signup(values);
        setUser(newUser);
      },
      signOut: async () => {
        try {
          await logout();
        } finally {
          setUser(null);
        }
      },
      refreshUser: async () => {
        if (!user) return;
        const updated = await getUserById(user.id);
        if (updated) setUser(updated);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
