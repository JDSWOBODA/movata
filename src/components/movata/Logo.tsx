import { Link } from "react-router-dom";
import { product } from "@/lib/brand";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export const Logo = ({ className = "", showWordmark = true }: LogoProps) => (
  <Link to="/" className={`inline-flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-4 ${className}`}>
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/10 bg-emerald-700 text-white shadow-sm">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <path d="M7 20.4c4.2-8.1 9.8-10.8 16.8-8.2 2.2.8 2.1 4.1-.2 4.7-4.5 1.1-7.5 3.5-9 7.1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M8.2 10.4c3.9-2.2 8.2-2.6 12.9-1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity=".65" />
      </svg>
    </span>
    {showWordmark ? <span className="text-lg font-semibold tracking-tight text-stone-950">{product.name}</span> : null}
  </Link>
);
