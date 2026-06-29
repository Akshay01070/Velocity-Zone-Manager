/**
 * src/App.tsx — Root router.
 *
 * Route structure:
 *   /login                 → LoginPage  (public)
 *   /signup                → SignupPage (public)
 *   /                      → Protected group (ProtectedRoute → AppShell)
 *     /dashboard           → DashboardPage
 *     /properties          → placeholder
 *     /properties/:id      → placeholder
 *   *                      → NotFoundPage
 */

import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function App() {
  return (
    <Routes>
      {/* ── Public ───────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ── Protected (all share the AppShell layout) ─────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Placeholder routes — pages to be implemented */}
          <Route path="/properties" element={<ComingSoon title="Properties" />} />
          <Route path="/properties/new" element={<ComingSoon title="New Property" />} />
          <Route path="/properties/:id" element={<ComingSoon title="Property Detail" />} />
        </Route>
      </Route>

      {/* ── Root redirect ─────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── 404 ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

/** Temporary placeholder for routes not yet implemented. */
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-24">
      <span className="text-5xl" aria-hidden="true">🚧</span>
      <h2 className="text-2xl font-semibold text-slate-100">{title}</h2>
      <p className="text-slate-400">This page is coming in a future iteration.</p>
    </div>
  );
}

export default App;
