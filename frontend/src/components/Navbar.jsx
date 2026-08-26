/**
 * Navbar — a rule and some words.
 *
 * Deliberately almost nothing: no pills, no chips, no avatars in circles, no
 * frosted panel. On a page whose whole argument is the food, the navigation's
 * job is to stay out of the way and to stop being a horizontal scroll problem
 * on a phone.
 */
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const linkClass =
  "px-3 py-2 text-xs font-display uppercase tracking-label text-mapo-muted hover:text-mapo-cream transition-colors duration-200";

export default function Navbar({ onOpenDiet, onOpenChat, onOpenLogs, onOpenAdmin }) {
  const { user, logout } = useAuth();

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 bg-mapo-ink/95 border-b border-mapo-cream/10"
      data-testid="navbar"
    >
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-lg tracking-tight text-mapo-cream" data-testid="logo-link">
          MAP<span className="text-mapo-accent">O</span>
        </Link>

        <nav className="hidden md:flex items-center">
          <a href="#burger" className={linkClass} data-testid="nav-burger">
            Anatomy
          </a>
          <a href="#pizza" className={linkClass} data-testid="nav-pizza">
            Builder
          </a>
          <a href="#feed" className={linkClass} data-testid="nav-feed">
            Explore
          </a>
          <button onClick={onOpenDiet} className={linkClass} data-testid="nav-diet">
            Diet plan
          </button>
          <button onClick={onOpenChat} className={linkClass} data-testid="nav-coach">
            Coach
          </button>
        </nav>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              {user.role === "admin" && (
                <button onClick={onOpenAdmin} className={`hidden sm:block ${linkClass}`} data-testid="open-admin-btn">
                  Admin
                </button>
              )}
              <button onClick={onOpenLogs} className={`hidden sm:block ${linkClass}`} data-testid="open-logs-btn">
                My logs
              </button>
              <span
                className="ml-2 px-3 py-2 text-xs font-display uppercase tracking-label text-mapo-cream max-w-[120px] truncate"
                data-testid="user-chip"
              >
                {user.name}
              </span>
              <button onClick={logout} className={linkClass} data-testid="logout-btn">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass} data-testid="nav-login">
                Log in
              </Link>
              <Link
                to="/register"
                className="pressable ml-1 border border-mapo-accent px-4 py-2 text-xs font-display uppercase tracking-label text-mapo-accent hover:bg-mapo-accent hover:text-mapo-ink"
                data-testid="nav-signup"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
