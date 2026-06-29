/**
 * src/App.tsx — Root router.
 *
 * Route structure:
 *   /login                 → LoginPage  (public)
 *   /signup                → SignupPage (public)
 *   /                      → Protected group (ProtectedRoute → AppShell)
 *     /dashboard           → DashboardPage
 *     /properties          → PropertiesPage (list + CRUD)
 *     /map                 → MapDemoPage (polygon draw/edit sandbox)
 *   *                      → NotFoundPage
 */

import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute }  from "@/components/routing/ProtectedRoute";
import { AppShell }        from "@/components/layout/AppShell";

import { LoginPage }       from "@/pages/LoginPage";
import { SignupPage }      from "@/pages/SignupPage";
import { DashboardPage }   from "@/pages/DashboardPage";
import { PropertiesPage }  from "@/pages/PropertiesPage";
import { MapDemoPage }     from "@/pages/MapDemoPage";
import { ZonesMapPage }    from "@/pages/ZonesMapPage";
import { NotFoundPage }    from "@/pages/NotFoundPage";

function App() {
  return (
    <Routes>
      {/* ── Public ───────────────────────────────────────────── */}
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ── Protected (all share the AppShell layout) ─────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:propertyId/zones" element={<ZonesMapPage />} />
          <Route path="/map"        element={<MapDemoPage />} />
        </Route>
      </Route>

      {/* ── Root redirect ─────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── 404 ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
