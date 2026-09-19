import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await login(
        formData.email,
        formData.password
      );

      if (data.user.role === "APPLICANT") {
        navigate("/applicant", { replace: true });
      } else if (data.user.role === "LOAN_OFFICER") {
        navigate("/officer", { replace: true });
      } else if (data.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-page">

      {/* Decorative background elements */}
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>
      <div className="auth-grid-pattern"></div>

      <div className="auth-layout">

        {/* LEFT SIDE */}
        <section className="auth-showcase">

          <div className="showcase-brand">
            <div className="showcase-brand-icon">
              $
            </div>

            <div>
              <div className="showcase-brand-name">
                Loan<span>Flow</span>
              </div>

              <div className="showcase-brand-tagline">
                SMART LENDING, SIMPLIFIED
              </div>
            </div>
          </div>

          <div className="showcase-content">

            <div className="showcase-pill">
              <span className="live-dot"></span>
              Your financial journey starts here
            </div>

            <h1>
              Make your goals
              <br />
              <span>financially possible.</span>
            </h1>

            <p>
              Apply for a loan, track your application,
              and stay informed at every step — all from
              one simple platform.
            </p>

            <div className="showcase-features">

              <div className="showcase-feature">
                <div className="feature-icon">
                  ✓
                </div>

                <div>
                  <strong>Simple application</strong>
                  <span>
                    Apply in a few guided steps
                  </span>
                </div>
              </div>

              <div className="showcase-feature">
                <div className="feature-icon cyan">
                  ◉
                </div>

                <div>
                  <strong>Real-time tracking</strong>
                  <span>
                    Know exactly where you stand
                  </span>
                </div>
              </div>

              <div className="showcase-feature">
                <div className="feature-icon purple">
                  ⌁
                </div>

                <div>
                  <strong>Transparent process</strong>
                  <span>
                    Clear status and repayment details
                  </span>
                </div>
              </div>

            </div>

          </div>

          <div className="showcase-footer">
            <span>Secure</span>
            <i></i>
            <span>Transparent</span>
            <i></i>
            <span>Built for you</span>
          </div>

        </section>


        {/* RIGHT SIDE */}
        <section className="auth-form-section">

          <div className="auth-card-modern">

            <div className="mobile-brand">
              <div className="showcase-brand-icon">
                $
              </div>

              <div>
                <div className="showcase-brand-name">
                  Loan<span>Flow</span>
                </div>
              </div>
            </div>

            <div className="auth-card-header">

              <div className="auth-icon">
                →
              </div>

              <div>
                <h2>Welcome back</h2>
                <p>
                  Sign in to continue to your account.
                </p>
              </div>

            </div>

            {error && (
              <div className="auth-error-modern">
                <div className="auth-error-icon">
                  !
                </div>

                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="modern-form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <div className="modern-input-wrapper">

                  <span className="input-icon">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />

                </div>
              </div>


              <div className="modern-form-group">

                <div className="label-row">
  <label htmlFor="password">
    Password
  </label>
</div>
                <div className="modern-input-wrapper">

                  <span className="input-icon">
                    •••
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>

                </div>

              </div>


              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-loader"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span>→</span>
                  </>
                )}
              </button>

            </form>


            <div className="auth-divider">
              <span>New to LoanFlow?</span>
            </div>


            <Link
              to="/signup"
              className="secondary-auth-button"
            >
              Create an account
              <span>→</span>
            </Link>


            <div className="auth-security-note">
              <span>⌁</span>
              <p>
                Your information is protected with
                secure authentication.
              </p>
            </div>

          </div>

          <div className="auth-copyright">
            © {new Date().getFullYear()} LoanFlow ·
            Loan Management Platform
          </div>

        </section>

      </div>
    </div>
  );
};

export default Login;