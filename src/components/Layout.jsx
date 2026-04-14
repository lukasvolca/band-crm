import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/contacts", icon: "person", label: "Contatos" },
  { to: "/groups", icon: "group", label: "Grupos" },
  { to: "/campaigns", icon: "campaign", label: "Campanhas" },
  { to: "/history", icon: "history", label: "Histórico" },
];

export default function Layout() {
  const navigate = useNavigate();
  const { session } = useAuth();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <nav className="flex flex-col h-screen w-56 flex-shrink-0 bg-surface-container-lowest z-50">
        {/* Logo */}
        <div className="px-5 py-7 border-b border-outline-variant/10">
          <h1 className="text-lg font-black text-on-surface leading-none uppercase tracking-tighter">
            La Rapaziada
          </h1>
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-primary-container mt-1">
            Music CRM
          </p>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-0.5 px-2 pt-4 flex-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 transition-colors group text-[0.68rem] font-bold uppercase tracking-widest
                ${
                  isActive
                    ? "border-l-4 border-primary-container text-on-surface bg-surface-container-low"
                    : "border-l-4 border-transparent text-on-surface/50 hover:bg-surface-container-low hover:text-on-surface"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-xl ${isActive ? "text-primary-container" : ""}`}
                  >
                    {icon}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-3 pb-6 pt-2 border-t border-outline-variant/10">
          <div className="mb-3 px-2 py-1">
            <p className="text-[0.6rem] text-on-surface/30 uppercase tracking-widest truncate">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 text-on-surface/40 hover:text-on-surface hover:bg-surface-container-low transition-colors text-[0.68rem] font-bold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sair
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-surface">
        <Outlet />
      </main>
    </div>
  );
}
