import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (event === "SIGNED_OUT") {
        setSession(null);
        setAuthError(null);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(getAuthErrorMessage(error));
      setSession(data.session);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      authError,
      signOut: async () => {
        setAuthError(null);
        const { error } = await supabase.auth.signOut();
        if (error) {
          const message = getAuthErrorMessage(error);
          setAuthError(message);
          throw new Error(message);
        }
      },
    }),
    [authError, loading, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
};
