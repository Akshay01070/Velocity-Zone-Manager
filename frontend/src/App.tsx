import { Routes, Route, Navigate } from "react-router-dom";

/**
 * App.tsx — Root router.
 *
 * Page components will be implemented in future iterations.
 * Currently provides placeholder routes to validate the router setup.
 */
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PlaceholderPage title="Login" />} />
      <Route path="/register" element={<PlaceholderPage title="Register" />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
      <Route path="/zones" element={<PlaceholderPage title="Zone Manager" />} />
      <Route path="/zones/:id" element={<PlaceholderPage title="Zone Detail" />} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<PlaceholderPage title="404 – Not Found" />} />
    </Routes>
  );
}

/** Temporary placeholder until page components are built. */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-slate-100">{title}</h1>
        <p className="mt-2 text-slate-400">
          Page component — to be implemented.
        </p>
      </div>
    </div>
  );
}

export default App;
