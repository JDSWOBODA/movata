import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/contexts/SessionContext";

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf6] p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-12 w-48 rounded-full" />
          <Skeleton className="h-80 rounded-[2rem]" />
          <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-36 rounded-[1.5rem]" /><Skeleton className="h-36 rounded-[1.5rem]" /><Skeleton className="h-36 rounded-[1.5rem]" /></div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};
