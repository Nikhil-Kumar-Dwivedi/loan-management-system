import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all the required fields.");
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await signup(
        formData.name.trim(),
        formData.email.trim(),
        formData.password
      );

      if (data.user.role === "APPLICANT") {
        navigate("/applicant", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modern-page">

      {/* Decorative background */}
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>
      <div className="auth-grid-pattern"></div>

      <div className="auth-layout signup-layout">

        {/* LEFT SIDE */}
        <section className="auth-showcase signup-showcase">

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
              Start your journey today
            </div>

            <h1>
              One application.
              <br />
              <span>Multiple possibilities.</span>
            </h1>

            <p>
              Create your LoanFlow account and manage
              your complete loan journey from application
              to approval.
            </p>


            <div className="signup-steps">

              <div className="signup-step active">
                <div className="step-number">
                  01
                </div>

                <div>
                  <strong>Create your account</strong>
                  <span>
                    Quick and secure registration
                  </span>
                </div>
              </div>


              <div className="signup-step">
                <div className="step-number">
                  02
                </div>

                <div>
                  <strong>Build your application</strong>
                  <span>
                    Tell us about your loan requirements
                  </span>
                </div>
              </div>


              <div className="signup-step">
                <div className="step-number">
                  03
                </div>

                <div>
                  <strong>Track your progress</strong>
                  <span>
                    Stay updated until your decision
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

          <div className="auth-card-modern signup-card">

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

              <div className="auth-icon signup-icon">
                +
              </div>

              <div>
                <h2>Create your account</h2>
                <p>
                  Join LoanFlow and start your loan journey.
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

              {/* Name */}
              <div className="modern-form-group">

                <label htmlFor="name">
                  Full name
                </label>

                <div className="modern-input-wrapper">

                  <span className="input-icon">
                    ◇
                  </span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />

                </div>

              </div>


              {/* Email */}
              <div className="modern-form-group">

                <label htmlFor="signup-email">
                  Email address
                </label>

                <div className="modern-input-wrapper">

                  <span className="input-icon">
                    @
                  </span>

                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />

                </div>

              </div>


              {/* Password */}
              <div className="modern-form-group">

                <label htmlFor="signup-password">
                  Password
                </label>

                <div className="modern-input-wrapper">

                  <span className="input-icon">
                    •••
                  </span>

                  <input
                    id="signup-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>

                </div>

              </div>


              {/* Confirm Password */}
              <div className="modern-form-group">

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="modern-input-wrapper">

                  <span className="input-icon">
                    ✓
                  </span>

                  <input
                    id="confirmPassword"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={
                      formData.confirmPassword
                    }
                    onChange={handleChange}
                    autoComplete="new-password"
                  />

                </div>

              </div>


              <div className="terms-note">
                By creating an account, you agree to use
                LoanFlow responsibly and provide accurate
                information.
              </div>


              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-loader"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <span>→</span>
                  </>
                )}
              </button>

            </form>


            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>


            <Link
              to="/login"
              className="secondary-auth-button"
            >
              Sign in instead
              <span>→</span>
            </Link>


            <div className="auth-security-note">
              <span>⌁</span>
              <p>
                Your account is protected with secure
                authentication.
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

export default Signup;