import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { UserProfile } from "@school-bus/shared";

import type { AdminRequestUser } from "./roleAccess";
import { getApiBaseUrl } from "./api";

type AdminSessionContextValue = {
  currentUser: AdminRequestUser | null;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOutSession: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  isLoading: boolean;
  isBootstrapping: boolean;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);
const adminSessionTokenStorageKey = "school-bus-admin-access-token";

export function AdminSessionProvider({ children }: PropsWithChildren) {
  const [sessionUser, setSessionUser] = useState<AdminRequestUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function restoreSessionFromStorage() {
      try {
        const accessToken = window.localStorage.getItem(adminSessionTokenStorageKey);
        if (!accessToken) {
          return;
        }

        const meResponse = await fetch(`${getApiBaseUrl()}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!meResponse.ok) {
          window.localStorage.removeItem(adminSessionTokenStorageKey);
          return;
        }

        const mePayload = (await meResponse.json()) as { user?: UserProfile };
        const user = mePayload.user;

        if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
          window.localStorage.removeItem(adminSessionTokenStorageKey);
          return;
        }

        if (!isCancelled) {
          setSessionUser({
            id: user.id,
            label: user.fullName,
            role: user.role,
            schoolId: user.schoolId,
            accessToken
          });
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void restoreSessionFromStorage();

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = useMemo<AdminSessionContextValue>(() => {
    async function signInWithEmailPassword(email: string, password: string) {
      setIsLoading(true);
      setAuthError(null);

      try {
        const loginResponse = await fetch(`${getApiBaseUrl()}/auth/email-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (!loginResponse.ok) {
          const payload = (await loginResponse.json()) as { error?: string };
          throw new Error(payload.error ?? "Sign-in failed");
        }

        const loginPayload = (await loginResponse.json()) as {
          token?: string;
          user?: UserProfile;
        };

        const accessToken = loginPayload.token;
        const loginUser = loginPayload.user;
        if (!accessToken || !loginUser) {
          throw new Error("Invalid login response");
        }

        if (loginUser.role !== "admin" && loginUser.role !== "super_admin") {
          throw new Error("This account is not allowed in admin web");
        }

        const meResponse = await fetch(`${getApiBaseUrl()}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!meResponse.ok) {
          const payload = (await meResponse.json()) as { error?: string };
          throw new Error(payload.error ?? "Failed to load admin profile");
        }

        const mePayload = (await meResponse.json()) as { user?: UserProfile };
        const user = mePayload.user;
        if (!user) {
          throw new Error("Profile missing in /auth/me response");
        }

        if (user.role !== "admin" && user.role !== "super_admin") {
          throw new Error("This account is not allowed in admin web");
        }

        window.localStorage.setItem(adminSessionTokenStorageKey, accessToken);

        setSessionUser({
          id: user.id,
          label: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
          accessToken
        });
      } catch (error) {
        window.localStorage.removeItem(adminSessionTokenStorageKey);
        setSessionUser(null);
        setAuthError(error instanceof Error ? error.message : "Sign-in failed");
      } finally {
        setIsLoading(false);
      }
    }

    async function signOutSession() {
      try {
        if (sessionUser?.accessToken) {
          await fetch(`${getApiBaseUrl()}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${sessionUser.accessToken}`
            }
          });
        }
      } finally {
        window.localStorage.removeItem(adminSessionTokenStorageKey);
        setSessionUser(null);
      }
    }

    return {
      currentUser: sessionUser,
      signInWithEmailPassword,
      signOutSession,
      authError,
      clearAuthError: () => setAuthError(null),
      isLoading,
      isBootstrapping
    };
  }, [authError, isBootstrapping, isLoading, sessionUser]);

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }

  return context;
}

export function useRequiredAdminUser() {
  const { currentUser } = useAdminSession();
  if (!currentUser) {
    throw new Error("No active admin user in session");
  }

  return currentUser;
}
