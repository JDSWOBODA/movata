import { Link, NavLink } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

const navItems = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Demo profile", href: "/dylan" },
  { label: "Integrations", href: "/#integrations" },
];

export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b border-stone-200/75 bg-[#fbfaf6]/85 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <Logo />
      <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
        {navItems.map((item) =>
          item.href.startsWith("/#") ? (
            <a key={item.label} href={item.href} className="text-sm font-medium text-stone-600 transition hover:text-emerald-800">
              {item.label}
            </a>
          ) : (
            <NavLink key={item.label} to={item.href} className="text-sm font-medium text-stone-600 transition hover:text-emerald-800">
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="hidden rounded-full text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 sm:inline-flex">
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild className="rounded-full bg-emerald-700 px-4 text-white shadow-sm hover:bg-emerald-800">
          <Link to="/onboarding">
            Create free<span className="hidden sm:inline"> profile</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </header>
);
