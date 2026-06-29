/**
 * src/pages/LoginPage.tsx — User login screen.
 */

import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState)?.from?.pathname ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-brand" aria-hidden="true">
        <div className="auth-brand-inner">
          <span className="auth-brand-icon">⬡</span>
          <h2 className="auth-brand-name">Velocity Zone Manager</h2>
          <p className="auth-brand-tagline">
            Create, visualize, and manage geographic zones on an interactive map.
          </p>
        </div>
        <div className="auth-brand-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-subtitle">Sign in to your account</p>
          </div>

          {error && (
            <div role="alert" className="alert alert--error">
              {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} noValidate className="auth-form">
            <Input
              id="login-email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="login-password"
              type="password"
              label="Password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              id="login-submit"
              type="submit"
              fullWidth
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          <p className="auth-redirect">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
