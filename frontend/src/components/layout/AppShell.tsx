/**
 * src/components/layout/AppShell.tsx — Authenticated app layout.
 *
 * Renders a collapsible sidebar + topbar frame.
 * The <Outlet /> is rendered in the main content area.
 */

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/properties", label: "Properties", icon: "⌂" },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="logo-icon">⬡</span>
          {sidebarOpen && <span className="logo-text">VZM</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item--active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="sidebar-footer">
          <button
            id="sidebar-toggle"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <h1 className="topbar-title">Velocity Zone Manager</h1>
          <div className="topbar-user">
            <span className="user-name">{user?.full_name ?? user?.email}</span>
            <button
              id="logout-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
