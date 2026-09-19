import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ApplicantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     FETCH APPLICATIONS
     ===================================================== */

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/loans/my");

      // The backend returns loanApplications. Keep "loans" as
      // a fallback so both applicant pages use the same data shape.
      const applications =
        response.data.loanApplications ||
        response.data.loans ||
        [];

      setLoans(Array.isArray(applications) ? applications : []);
    } catch (err) {
      console.error("Fetch loans error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  /* =====================================================
     FORMATTING HELPERS
     ===================================================== */

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatLoanType = (loanType) => {
    if (!loanType) return "Loan";

    const labels = {
      PERSONAL: "Personal Loan",
      HOME: "Home Loan",
      VEHICLE: "Vehicle Loan",
      BUSINESS: "Business Loan",
    };

    return labels[loanType] || `${loanType} Loan`;
  };

  const getLoanIcon = (loanType) => {
    switch (loanType) {
      case "HOME":
        return "⌂";

      case "VEHICLE":
        return "▣";

      case "BUSINESS":
        return "◆";

      case "PERSONAL":
      default:
        return "$";
    }
  };

  /* =====================================================
     STATISTICS
     ===================================================== */

  const totalApplications = loans.length;

  const drafts = loans.filter(
    (loan) => loan.status === "DRAFT"
  ).length;

  const underReview = loans.filter((loan) =>
    [
      "SUBMITTED",
      "UNDER_REVIEW",
      "MORE_INFO_NEEDED",
      "OFFICER_RECOMMENDED_APPROVAL",
      "OFFICER_RECOMMENDED_REJECTION",
    ].includes(loan.status)
  ).length;

  const approved = loans.filter(
    (loan) => loan.status === "APPROVED"
  ).length;

  /* =====================================================
     LATEST DRAFT
     ===================================================== */

  const latestDraft = useMemo(() => {
    const draftApplications = loans.filter(
      (loan) => loan.status === "DRAFT"
    );

    if (draftApplications.length === 0) {
      return null;
    }

    return draftApplications[0];
  }, [loans]);

  /* =====================================================
     START / RESUME APPLICATION
     ===================================================== */

  const handleApplyForLoan = async () => {
  try {
    setError("");
    setCreatingDraft(true);

    /*
     * Starting a new application intentionally creates
     * one new draft.
     */
    const response = await api.post("/loans");

    const newLoan = response.data.loanApplication;

    if (!newLoan?._id) {
      throw new Error(
        "Draft was created but no application ID was returned."
      );
    }

    /*
     * Open the newly created draft.
     */
    navigate(`/applicant/apply/${newLoan._id}`);

  } catch (err) {
    console.error("Start application error:", err);

    setError(
      err.response?.data?.message ||
        "Unable to start your loan application. Please try again."
    );
  } finally {
    setCreatingDraft(false);
  }
};
  /* =====================================================
     OPEN APPLICATION
     ===================================================== */

  const handleApplicationClick = (loan) => {
    /*
     * Drafts belong to the application editor.
     *
     * Everything else belongs to the details page.
     */
    if (loan.status === "DRAFT") {
      navigate(`/applicant/apply/${loan._id}`);
      return;
    }

    navigate(`/applicant/loans/${loan._id}`);
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="app-shell">
      <Navbar />

      <main className="dashboard-container">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="dashboard-hero">

          <div>
            <div className="welcome-label">
              APPLICANT PORTAL
            </div>

            <h1>
              Good morning,{" "}
              <span>
                {user?.name?.split(" ")[0] || "there"}
              </span>{" "}
              👋
            </h1>

            <p>
              Manage your loan applications and track your
              application progress from one place.
            </p>
          </div>

          <button
            className="apply-button"
            onClick={handleApplyForLoan}
            disabled={creatingDraft}
          >
            <span className="button-plus">
              {creatingDraft ? "…" : "+"}
            </span>

            {creatingDraft
  ? "Starting..."
  : "Apply for a Loan"}
          </button>

        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="dashboard-error">
            <span>!</span>

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {/* =================================================
            STATISTICS
            ================================================= */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon blue">
              ◈
            </div>

            <div>
              <p>Total Applications</p>
              <h2>{totalApplications}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              ◌
            </div>

            <div>
              <p>Drafts</p>
              <h2>{drafts}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cyan">
              ◉
            </div>

            <div>
              <p>Under Review</p>
              <h2>{underReview}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              ✓
            </div>

            <div>
              <p>Approved</p>
              <h2>{approved}</h2>
            </div>
          </div>

        </section>

        {/* =================================================
            APPLICATIONS
            ================================================= */}

        <section className="applications-section">

          <div className="section-heading">

            <div>
              <h2>Your Applications</h2>

              <p>
                View and track all your loan applications.
              </p>
            </div>

            {loans.length > 0 && (
              <button
                className="view-all-button"
                onClick={fetchLoans}
                disabled={loading}
              >
                ↻ {loading ? "Refreshing..." : "Refresh"}
              </button>
            )}

          </div>

          {/* Loading */}

          {loading && (
            <div className="dashboard-state">
              <div className="loader"></div>

              <p>
                Loading your applications...
              </p>
            </div>
          )}

          {/* Error */}

          {!loading && error && (
            <div className="dashboard-error">
              <span>!</span>

              <div>
                <strong>
                  Unable to load applications
                </strong>

                <p>{error}</p>
              </div>

              <button onClick={fetchLoans}>
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            loans.length === 0 && (
              <div className="empty-state">

                <div className="empty-icon">
                  $
                </div>

                <h3>
                  No loan applications yet
                </h3>

                <p>
                  Start your first application and get your
                  loan journey moving.
                </p>

                <button
                  className="apply-button"
                  onClick={handleApplyForLoan}
                  disabled={creatingDraft}
                >
                  <span className="button-plus">
                    {creatingDraft ? "…" : "+"}
                  </span>

                  {creatingDraft
                    ? "Starting..."
                    : "Start Loan Application"}
                </button>

              </div>
            )}

          {/* Application List */}

          {!loading &&
            !error &&
            loans.length > 0 && (
              <div className="loan-list">

                {loans.map((loan) => {

                  /*
                   * Backend schema:
                   *
                   * loan.loanDetails.loanType
                   * loan.loanDetails.amount
                   * loan.loanDetails.tenure
                   */

                  const loanType =
                    loan.loanDetails?.loanType;

                  const amount =
                    loan.loanDetails?.amount;

                  const tenure =
                    loan.loanDetails?.tenure;

                  return (
                    <div
                      className="loan-card"
                      key={loan._id}
                      onClick={() =>
                        handleApplicationClick(loan)
                      }
                    >

                      {/* Card Top */}

                      <div className="loan-card-top">

                        <div className="loan-type-wrapper">

                          <div className="loan-type-icon">
                            {getLoanIcon(loanType)}
                          </div>

                          <div>
                            <h3>
                              {formatLoanType(
                                loanType
                              )}
                            </h3>

                            <p>
                              Application ID:{" "}
                              {loan._id
                                .slice(-8)
                                .toUpperCase()}
                            </p>
                          </div>

                        </div>

                        <StatusBadge
                          status={loan.status}
                        />

                      </div>

                      {/* Card Details */}

                      <div className="loan-card-details">

                        <div>
                          <span>
                            Loan Amount
                          </span>

                          <strong>
                            {formatCurrency(amount)}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Tenure
                          </span>

                          <strong>
                            {tenure
                              ? `${tenure} months`
                              : "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Interest Rate
                          </span>

                          <strong>
                            {loan.interestRate
                              ? `${loan.interestRate}% p.a.`
                              : "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Applied On
                          </span>

                          <strong>
                            {formatDate(
                              loan.createdAt
                            )}
                          </strong>
                        </div>

                      </div>

                      {/* Card Footer */}

                      <div className="loan-card-footer">

                        <span>
                          {loan.status === "DRAFT"
                            ? "Continue application"
                            : "View application details"}
                        </span>

                        <span className="arrow">
                          →
                        </span>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </section>

      </main>
    </div>
  );
};

export default ApplicantDashboard;