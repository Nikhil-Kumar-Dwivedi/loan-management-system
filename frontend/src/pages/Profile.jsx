import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  const getRoleName = () => {
    if (user?.role === "LOAN_OFFICER") {
      return "Loan Officer";
    }

    if (user?.role === "ADMIN") {
      return "Administrator";
    }

    return "Applicant";
  };

  const getInitials = () => {
    if (!user?.name) return "A";

    const parts = user.name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div className="app-shell">

      <header className="navbar">
        <div className="navbar-container">

          <div
            className="brand"
            onClick={() => navigate("/applicant")}
          >
            <div className="brand-icon">
              $
            </div>

            <div>
              <div className="brand-name">
                Loan<span>Flow</span>
              </div>

              <div className="brand-tagline">
                Smart lending, simplified
              </div>
            </div>
          </div>

          <button
            className="profile-back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

        </div>
      </header>


      <main className="profile-container">

        <div className="profile-header">

          <div>
            <div className="welcome-label">
              ACCOUNT
            </div>

            <h1>
              Your Profile
            </h1>

            <p>
              View your account information and manage
              your LoanFlow session.
            </p>
          </div>

        </div>


        <div className="profile-layout">

          {/* Profile Card */}
          <section className="profile-main-card">

            <div className="profile-cover"></div>

            <div className="profile-main-content">

              <div className="profile-avatar-large">
                {getInitials()}
              </div>

              <div className="profile-name-section">

                <h2>
                  {user?.name || "User"}
                </h2>

                <span className="profile-role-badge">
                  {getRoleName()}
                </span>

              </div>


              <div className="profile-divider"></div>


              <div className="profile-information">

                <div className="profile-info-item">

                  <div className="profile-info-icon">
                    @
                  </div>

                  <div>
                    <span>Email address</span>
                    <strong>
                      {user?.email || "-"}
                    </strong>
                  </div>

                </div>


                <div className="profile-info-item">

                  <div className="profile-info-icon">
                    ◈
                  </div>

                  <div>
                    <span>Account role</span>
                    <strong>
                      {getRoleName()}
                    </strong>
                  </div>

                </div>


                <div className="profile-info-item">

                  <div className="profile-info-icon green">
                    ✓
                  </div>

                  <div>
                    <span>Account status</span>
                    <strong className="active-account">
                      Active
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* Security Card */}
          <aside className="profile-side-card">

            <div className="side-card-icon">
              ⌁
            </div>

            <h3>
              Account Security
            </h3>

            <p>
              Your session is protected using secure
              token-based authentication.
            </p>


            <div className="security-status">

              <span className="security-dot"></span>

              <div>
                <strong>
                  Session secured
                </strong>

                <small>
                  Your account is currently active
                </small>
              </div>

            </div>


            {/* Logout */}
            <button
              className="profile-logout-button"
              onClick={handleLogout}
            >
              <span>
                ↪
              </span>

              Logout from LoanFlow
            </button>

          </aside>

        </div>

      </main>

    </div>
  );
};

export default Profile;