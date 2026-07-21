import { LockKeyhole } from "lucide-react";
import { Logo } from "@/components/movata/Logo";
import { StatCard } from "@/components/movata/StatCard";
import { useSession } from "@/contexts/SessionContext";

const adminEmails: string[] = [];

const Admin = () => {
  const { user } = useSession();
  const allowed = user?.email && adminEmails.includes(user.email);

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#fbfaf6] px-4 py-8 text-stone-950">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
          <Logo className="justify-center" />
          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100"><LockKeyhole className="h-7 w-7 text-stone-500" /></div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Admin access restricted</h1>
          <p className="mt-3 text-stone-500">This route is prepared for lightweight platform analytics but is not exposed to ordinary users.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <header className="border-b border-stone-200 bg-white px-4 py-3 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><Logo /></div></header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Movata admin</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total users" value="—" detail="wired in Phase 6" />
          <StatCard label="Published profiles" value="—" detail="discoverability" />
          <StatCard label="Connected providers" value="—" detail="sync health" />
          <StatCard label="Imported activities" value="—" detail="all sources" />
          <StatCard label="Sync failures" value="—" detail="needs review" />
        </div>
      </section>
    </main>
  );
};

export default Admin;
