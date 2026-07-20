import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Logo } from "@/components/runstory/Logo";
import { product } from "@/lib/brand";

const Login = () => {
  const { user, authError } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-4 py-8 text-stone-950">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-stone-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-4">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="mt-8 grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm lg:grid-cols-[.92fr_1.08fr]">
          <section className="bg-stone-950 p-8 text-white sm:p-10">
            <Logo className="text-white" />
            <h1 className="mt-14 text-4xl font-semibold tracking-tight sm:text-5xl">Create your running page.</h1>
            <p className="mt-4 max-w-md text-lg leading-8 text-stone-300">Email, password, and magic-link sign-in are wired through Supabase Auth. Strava sync remains server-side behind the {product.annualPrice} unlock.</p>
            <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-semibold text-emerald-200">Privacy defaults</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-300">
                <li>• Route start and finish are hidden publicly.</li>
                <li>• Exact start times are optional.</li>
                <li>• Provider tokens are never exposed in the browser.</li>
              </ul>
            </div>
          </section>
          <section className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight">Sign in to {product.name}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">Use email, password, or a magic link. New users continue to onboarding to reserve a username.</p>
              {authError ? (
                <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{authError}</p>
              ) : null}
              <div className="mt-6 rounded-[1.5rem] border border-stone-200 p-4">
                <Auth
                  supabaseClient={supabase}
                  providers={[]}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: "#047857",
                          brandAccent: "#065f46",
                        },
                        radii: {
                          borderRadiusButton: "999px",
                          inputBorderRadius: "16px",
                        },
                      },
                    },
                  }}
                  theme="light"
                  magicLink
                  redirectTo={`${window.location.origin}/dashboard`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Login;
