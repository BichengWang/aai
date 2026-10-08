import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { User } from "@supabase/supabase-js";
import { deriveProfileFromUser, loadProfileForUser } from "../lib/profile";
import { navigateToUrl } from "../lib/browser";
import { syncResearchAccess } from "../lib/researchAccess";
import {
  getAuthErrorMessage,
  getGoogleRedirectUrl,
  getMissingConfigMessage,
  getSupabase,
  isSupabaseConfigured,
} from "../lib/supabase";
import type { AppUserProfile, AuthContextValue } from "../types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [session, setSession] = useState<AuthContextValue["session"]>(null);
  const [profile, setProfile] = useState<AuthContextValue["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const applySignedInUser = useCallback(async (nextUser: User) => {
    try {
      const nextProfile = await loadProfileForUser(nextUser);
      startTransition(() => {
        setProfile(nextProfile);
        setAuthError(null);
      });
    } catch (error) {
      startTransition(() => {
        setProfile(deriveProfileFromUser(nextUser));
        setAuthError(getAuthErrorMessage(error));
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    const bootstrap = async () => {
      let client: Awaited<ReturnType<typeof getSupabase>>;

      try {
        client = await getSupabase();
      } catch (error) {
        if (active) {
          startTransition(() => {
            setAuthError(getAuthErrorMessage(error));
            setLoading(false);
          });
        }
        return;
      }

      if (!active) {
        return;
      }

      if (!client) {
        setLoading(false);
        return;
      }

      const initialSessionRequest = client.auth.getSession();

      subscription = client.auth.onAuthStateChange((_, nextSession) => {
        syncResearchAccess(nextSession);
        startTransition(() => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);

          if (!nextSession?.user) {
            setProfile(null);
            setAuthError(null);
          }
        });

        if (nextSession?.user) {
          window.setTimeout(() => {
            void applySignedInUser(nextSession.user);
          }, 0);
        }
      }).data.subscription;

      const {
        data: { session: initialSession },
        error,
      } = await initialSessionRequest;

      if (!active) {
        return;
      }

      if (error) {
        startTransition(() => {
          setAuthError(getAuthErrorMessage(error));
          setLoading(false);
        });
        return;
      }

      syncResearchAccess(initialSession);
      startTransition(() => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      });

      if (initialSession?.user) {
        void applySignedInUser(initialSession.user);
      }
    };

    void bootstrap();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [applySignedInUser]);

  const signInWithGoogle = useCallback(async (nextPath?: string) => {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error(getMissingConfigMessage());
    }

    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getGoogleRedirectUrl(nextPath),
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }

    if (!data?.url) {
      const message = "Supabase did not return an OAuth redirect URL.";
      setAuthError(message);
      throw new Error(message);
    }

    navigateToUrl(data.url);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error(getMissingConfigMessage());
    }

    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }

    syncResearchAccess(null);
    startTransition(() => {
      setSession(null);
      setUser(null);
      setProfile(null);
      setAuthError(null);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    await applySignedInUser(user);
  }, [user, applySignedInUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      authConfigured: isSupabaseConfigured,
      authError,
      clearAuthError: () => setAuthError(null),
      refreshProfile,
      signInWithGoogle,
      signOut,
    }),
    [authError, loading, profile, session, signOut, user, refreshProfile, signInWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
