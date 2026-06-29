/**
 * src/components/layout/Navbar.tsx
 *
 * Standalone top navigation bar (used outside the AppShell, e.g. public pages).
 * For authenticated pages the topbar is part of AppShell.
 */

export function Navbar() {
  return (
    <header className="topbar">
      <span className="logo-text" style={{ color: "var(--clr-text)" }}>
        ⬡ Velocity Zone Manager
      </span>
    </header>
  );
}
