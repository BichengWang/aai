import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deriveProfileFromUser } from "./profile";

export function useContactIdentity() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;
  const [draft, setDraft] = useState<{ userId: string | null; name?: string; email?: string }>({ userId });

  // Clear edits when the account changes, but preserve them while its profile loads.
  if (draft.userId !== userId) {
    setDraft({ userId });
  }

  const account = user ? deriveProfileFromUser(user) : null;
  const accountProfile = user && profile?.user_id === user.id ? profile : null;
  const edits = draft.userId === userId ? draft : { name: undefined, email: undefined };

  return {
    name: edits.name ?? accountProfile?.full_name ?? account?.full_name ?? "",
    email: edits.email ?? accountProfile?.email ?? account?.email ?? "",
    setName: (name: string) => setDraft((current) => ({ ...current, name })),
    setEmail: (email: string) => setDraft((current) => ({ ...current, email })),
  };
}
