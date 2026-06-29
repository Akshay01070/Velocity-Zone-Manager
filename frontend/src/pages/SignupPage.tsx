/**
 * src/pages/SignupPage.tsx — New user registration screen.
 */

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (password !== confirm) errs.confirm = "Passwords do not match.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ email, password, full_name: fullName });
      navigate("/login", {
        state: { registered: true },
        replace: true,
      });
    } catch {
      setError("Registration failed. The email may already be in use.");
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
            Join the platform and start managing your velocity zones today.
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
            <h1 className="auth-card-title">Create account</h1>
            <p className="auth-card-subtitle">Get started for free</p>
          </div>

          {error && (
            <div role="alert" className="alert alert--error">
              {error}
            </div>
          )}

          <form
            id="signup-form"
            onSubmit={handleSubmit}
            noValidate
            className="auth-form"
          >
            <Input
              id="signup-fullname"
              type="text"
              label="Full name"
              autoComplete="name"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldErrors.fullName}
              required
            />
            <Input
              id="signup-email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              required
            />
            <Input
              id="signup-password"
              type="password"
              label="Password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
            />
            <Input
              id="signup-confirm"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={fieldErrors.confirm}
              required
            />

            <Button
              id="signup-submit"
              type="submit"
              fullWidth
              isLoading={isSubmitting}
            >
              Create account
            </Button>
          </form>

          <p className="auth-redirect">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
