import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Navbar = () => {

  const navigate = useNavigate();

  const { user } = useAuth();


  const role = user?.role;


  const isApplicant =
    role === "APPLICANT";

  const isOfficer =
    role === "LOAN_OFFICER";

  const isAdmin =
    role === "ADMIN";


  const dashboardPath =
    isApplicant
      ? "/applicant"
      : isOfficer
      ? "/officer"
      : "/admin";


  const dashboardLabel =
    isApplicant
      ? "Dashboard"
      : isOfficer
      ? "Review Queue"
      : "Admin Dashboard";


  const secondNavLabel =
    isApplicant
      ? "My Applications"
      : isOfficer
      ? "Applications"
      : "All Applications";


  const secondNavPath =
    isApplicant
      ? "/applicant/applications"
      : isOfficer
      ? "/officer"
      : "/admin/loans";


  const handleProfileClick = () => {
    navigate("/profile");
  };


  const getRoleLabel = () => {

    if (isOfficer) {
      return "Loan Officer";
    }

    if (isAdmin) {
      return "Administrator";
    }

    return "Applicant";
  };


  return (

    <header className="navbar">

      <div className="navbar-container">


        {/* ======================================================
            BRAND
        ====================================================== */}

        <div
          className="brand"
          onClick={() =>
            navigate(
              dashboardPath
            )
          }
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


        {/* ======================================================
            NAVIGATION
        ====================================================== */}

        <nav className="nav-links">

          <button
            className="nav-link active"
            onClick={() =>
              navigate(
                dashboardPath
              )
            }
          >
            {dashboardLabel}
          </button>


          <button
            className="nav-link"
            onClick={() =>
              navigate(
                secondNavPath
              )
            }
          >
            {secondNavLabel}
          </button>

        </nav>


        {/* ======================================================
            PROFILE
        ====================================================== */}

        <button
          className="nav-profile"
          onClick={
            handleProfileClick
          }
        >

          <div className="user-info">

            <span className="user-name">
              {user?.name ||
                "User"}
            </span>

            <span className="user-role">
              {getRoleLabel()}
            </span>

          </div>


          <div className="avatar">

            {(user?.name ||
              "U")
              .charAt(0)
              .toUpperCase()}

          </div>


          <span className="profile-arrow">
            ›
          </span>

        </button>

      </div>

    </header>
  );
};


export default Navbar;