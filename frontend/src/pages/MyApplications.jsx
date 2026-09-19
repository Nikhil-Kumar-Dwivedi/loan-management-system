import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";


const MyApplications = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("ALL");


  /* ============================================================
     FETCH APPLICATIONS
     ============================================================ */

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/loans/my");

        /*
         * Backend returns loanApplications.
         * Keep loans as fallback for compatibility.
         */
        setLoans(
          response.data.loanApplications ||
          response.data.loans ||
          []
        );

      } catch (err) {
        console.error(
          "Failed to fetch applications:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to load your applications."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);


  /* ============================================================
     COUNTS
     ============================================================ */

  const totalApplications = loans.length;

  const draftApplications = loans.filter(
    (loan) => loan.status === "DRAFT"
  ).length;

  const underReviewApplications = loans.filter(
    (loan) =>
      [
        "SUBMITTED",
        "UNDER_REVIEW",
        "MORE_INFO_NEEDED",
        "OFFICER_RECOMMENDED_APPROVAL",
        "OFFICER_RECOMMENDED_REJECTION",
      ].includes(loan.status)
  ).length;

  const approvedApplications = loans.filter(
    (loan) => loan.status === "APPROVED"
  ).length;


  /* ============================================================
     FILTER
     ============================================================ */

  const filteredLoans = useMemo(() => {

    if (activeFilter === "DRAFT") {
      return loans.filter(
        (loan) => loan.status === "DRAFT"
      );
    }

    if (activeFilter === "UNDER_REVIEW") {
      return loans.filter(
        (loan) =>
          [
            "SUBMITTED",
            "UNDER_REVIEW",
            "MORE_INFO_NEEDED",
            "OFFICER_RECOMMENDED_APPROVAL",
            "OFFICER_RECOMMENDED_REJECTION",
          ].includes(loan.status)
      );
    }

    if (activeFilter === "APPROVED") {
      return loans.filter(
        (loan) => loan.status === "APPROVED"
      );
    }

    return loans;

  }, [loans, activeFilter]);


  /* ============================================================
     HELPERS
     ============================================================ */

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };


  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  const getLoanTypeLabel = (loanType) => {

    const labels = {
      PERSONAL: "Personal Loan",
      HOME: "Home Loan",
      VEHICLE: "Vehicle Loan",
      BUSINESS: "Business Loan",
      PROFESSIONAL: "Professional Loan",
    };

    return (
      labels[loanType] ||
      loanType ||
      "Loan Application"
    );
  };


  /* ============================================================
     IMPORTANT:
     OPEN APPLICATION
     ============================================================ */

  const handleApplicationClick = (loan) => {

    /*
     * DRAFT:
     * Continue editing the saved application.
     */
    if (loan.status === "DRAFT") {
      navigate(
        `/applicant/apply/${loan._id}`
      );
      return;
    }

    /*
     * SUBMITTED / UNDER REVIEW /
     * MORE INFO / APPROVED / REJECTED:
     * Open the application details page.
     */
    navigate(
      `/applicant/loans/${loan._id}`
    );
  };


  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="applications-page">

          <div className="applications-loading">
            <div className="loader"></div>

            <p>
              Loading your applications...
            </p>
          </div>

        </main>
      </>
    );
  }


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <Navbar />

      <main className="applications-page">

        {/* ======================================================
            HEADER
            ====================================================== */}

        <section className="applications-header">

          <div>

            <p className="applications-eyebrow">
              APPLICATION CENTER
            </p>

            <h1>
              My Applications
            </h1>

            <p>
              Track and manage all your loan
              applications in one place.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/applicant/apply")
            }
          >
            + New Application
          </button>

        </section>


        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (
          <div className="applications-error">
            {error}
          </div>
        )}


        {/* ======================================================
            STAT CARDS
            ====================================================== */}

        <section className="application-stats">

          <button
            className={`application-stat-card stat-total ${
              activeFilter === "ALL"
                ? "stat-active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("ALL")
            }
          >

            <div className="stat-icon">
              ◌
            </div>

            <div className="stat-content">

              <span>
                Total Applications
              </span>

              <strong>
                {totalApplications}
              </strong>

            </div>

          </button>


          <button
            className={`application-stat-card stat-draft ${
              activeFilter === "DRAFT"
                ? "stat-active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("DRAFT")
            }
          >

            <div className="stat-icon">
              ◉
            </div>

            <div className="stat-content">

              <span>
                Drafts
              </span>

              <strong>
                {draftApplications}
              </strong>

            </div>

          </button>


          <button
            className={`application-stat-card stat-review ${
              activeFilter === "UNDER_REVIEW"
                ? "stat-active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("UNDER_REVIEW")
            }
          >

            <div className="stat-icon">
              ◌
            </div>

            <div className="stat-content">

              <span>
                Under Review
              </span>

              <strong>
                {underReviewApplications}
              </strong>

            </div>

          </button>


          <button
            className={`application-stat-card stat-approved ${
              activeFilter === "APPROVED"
                ? "stat-active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("APPROVED")
            }
          >

            <div className="stat-icon">
              ✓
            </div>

            <div className="stat-content">

              <span>
                Approved
              </span>

              <strong>
                {approvedApplications}
              </strong>

            </div>

          </button>

        </section>


        {/* ======================================================
            APPLICATION LIST
            ====================================================== */}

        <section className="applications-list-section">

          <div className="applications-list-header">

            <div>

              <h2>
                {activeFilter === "ALL"
                  ? "All Applications"
                  : activeFilter === "DRAFT"
                  ? "Draft Applications"
                  : activeFilter === "UNDER_REVIEW"
                  ? "Applications Under Review"
                  : "Approved Applications"}
              </h2>

              <span>
                {filteredLoans.length} application
                {filteredLoans.length !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

          </div>


          {/* ====================================================
              EMPTY
              ==================================================== */}

          {filteredLoans.length === 0 ? (

            <div className="applications-empty">

              <div className="empty-icon">
                ◌
              </div>

              <h3>
                No applications found
              </h3>

              <p>
                {activeFilter === "DRAFT"
                  ? "You don't have any saved drafts."
                  : activeFilter === "UNDER_REVIEW"
                  ? "You don't have any applications currently under review."
                  : activeFilter === "APPROVED"
                  ? "You don't have any approved applications yet."
                  : "You haven't created any loan applications yet."}
              </p>

              {activeFilter === "ALL" && (
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      "/applicant/apply"
                    )
                  }
                >
                  Start Your First Application
                </button>
              )}

            </div>

          ) : (

            <div className="applications-grid">

              {filteredLoans.map((loan) => (

                <article
                  key={loan._id}
                  className="application-card"
                  onClick={() =>
                    handleApplicationClick(
                      loan
                    )
                  }
                >

                  <div className="application-card-top">

                    <div>

                      <span className="application-id">
                        Application #
                        {loan._id
                          .slice(-6)
                          .toUpperCase()}
                      </span>

                      <h3>
                        {getLoanTypeLabel(
                          loan.loanDetails
                            ?.loanType ||
                          loan.loanType
                        )}
                      </h3>

                    </div>

                    <StatusBadge
                      status={loan.status}
                    />

                  </div>


                  <div className="application-card-details">

                    <div>

                      <span>
                        Loan Amount
                      </span>

                      <strong>
                        {formatCurrency(
                          loan.loanDetails
                            ?.amount ||
                          loan.loanAmount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Tenure
                      </span>

                      <strong>
                        {loan.loanDetails
                          ?.tenure
                          ? `${loan.loanDetails.tenure} months`
                          : loan.tenureMonths
                          ? `${loan.tenureMonths} months`
                          : "—"}
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


                  <div className="application-card-footer">

                    <span>
                      {loan.status === "DRAFT"
                        ? "Continue application"
                        : "View application"}
                    </span>

                    <span className="application-arrow">
                      →
                    </span>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>
    </>
  );
};


export default MyApplications;