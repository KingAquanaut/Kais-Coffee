"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth as authApi, ApiError, type User } from "@/lib/api";

const TOKEN_KEY = "kc_token";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setState(s => ({ ...s, loading: false })); return; }

    authApi.me(stored)
      .then(user => setState({ user, token: stored, loading: false }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, loading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { user, token } = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, loading: false });
    return user;
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }): Promise<User> => {
    const { user, token } = await authApi.register(data);
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, loading: false });
    return user;
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) await authApi.logout(token).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const user = await authApi.me(token);
    setState(s => ({ ...s, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Convenience: returns the token from localStorage (for API calls outside context) */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
