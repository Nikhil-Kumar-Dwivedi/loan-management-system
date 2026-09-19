import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

const getLoanType = (type) => {
    const types = {
        PERSONAL: "Personal Loan",
        HOME: "Home Loan",
        VEHICLE: "Vehicle Loan",
        BUSINESS: "Business Loan",
    };

    return types[type] || type || "Loan";
};

const OfficerDashboard = () => {
    const navigate = useNavigate();

    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    const fetchLoans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/officer/loans", {
                params: {
                    limit: 50,
                },
            });

            setLoans(response.data.loans || []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load applications."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const filteredLoans = loans.filter((loan) => {
        const matchesStatus =
            statusFilter === "ALL" ||
            loan.status === statusFilter;

        const applicantName =
            loan.applicant?.name?.toLowerCase() || "";

        const applicantEmail =
            loan.applicant?.email?.toLowerCase() || "";

        const loanType =
            loan.loanDetails?.loanType?.toLowerCase() || "";

        const query = search.toLowerCase().trim();

        const matchesSearch =
            !query ||
            applicantName.includes(query) ||
            applicantEmail.includes(query) ||
            loanType.includes(query);

        return matchesStatus && matchesSearch;
    });

    const submittedCount = loans.filter(
        (loan) => loan.status === "SUBMITTED"
    ).length;

    const underReviewCount = loans.filter(
        (loan) => loan.status === "UNDER_REVIEW"
    ).length;

    const moreInfoCount = loans.filter(
        (loan) => loan.status === "MORE_INFO_NEEDED"
    ).length;

    return (
        <div className="app-shell">
            <Navbar />

            <main className="officer-page">

                {/* HEADER */}
                <section className="officer-header">

                    <div>
                        <span className="officer-eyebrow">
                            LOAN OFFICER
                        </span>

                        <h1>
                            Application Review
                        </h1>

                        <p>
                            Review submitted loan applications,
                            check eligibility and send your
                            recommendation to the Admin.
                        </p>
                    </div>

                    <button
                        className="officer-refresh-btn"
                        onClick={fetchLoans}
                    >
                        ↻ Refresh
                    </button>

                </section>

                {/* STATS */}
                <section className="officer-stats">

                    <div
                        className={`officer-stat ${
                            statusFilter === "SUBMITTED"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("SUBMITTED")
                        }
                    >
                        <span className="officer-stat-icon">
                            📥
                        </span>

                        <div>
                            <span>
                                Submitted
                            </span>

                            <strong>
                                {submittedCount}
                            </strong>
                        </div>
                    </div>

                    <div
                        className={`officer-stat ${
                            statusFilter === "UNDER_REVIEW"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("UNDER_REVIEW")
                        }
                    >
                        <span className="officer-stat-icon">
                            🔍
                        </span>

                        <div>
                            <span>
                                Under Review
                            </span>

                            <strong>
                                {underReviewCount}
                            </strong>
                        </div>
                    </div>

                    <div
                        className={`officer-stat ${
                            statusFilter === "MORE_INFO_NEEDED"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter(
                                "MORE_INFO_NEEDED"
                            )
                        }
                    >
                        <span className="officer-stat-icon">
                            ℹ️
                        </span>

                        <div>
                            <span>
                                More Info
                            </span>

                            <strong>
                                {moreInfoCount}
                            </strong>
                        </div>
                    </div>

                    <div
                        className={`officer-stat ${
                            statusFilter === "ALL"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("ALL")
                        }
                    >
                        <span className="officer-stat-icon">
                            📋
                        </span>

                        <div>
                            <span>
                                All Applications
                            </span>

                            <strong>
                                {loans.length}
                            </strong>
                        </div>
                    </div>

                </section>

                {/* APPLICATIONS */}
                <section className="officer-applications-section">

                    <div className="officer-section-header">

                        <div>
                            <h2>
                                Submitted Applications
                            </h2>

                            <p>
                                Open an application to review
                                applicant details, documents and
                                eligibility.
                            </p>
                        </div>

                        <div className="officer-filters">

                            <div className="officer-search">
                                🔎

                                <input
                                    type="text"
                                    placeholder="Search applicant..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All
                                </option>

                                <option value="SUBMITTED">
                                    Submitted
                                </option>

                                <option value="UNDER_REVIEW">
                                    Under Review
                                </option>

                                <option value="MORE_INFO_NEEDED">
                                    More Info Needed
                                </option>
                            </select>

                        </div>

                    </div>

                    {loading ? (
                        <div className="officer-state">
                            <div className="loader"></div>
                            <p>
                                Loading applications...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="officer-state error">
                            <h3>
                                Unable to load applications
                            </h3>

                            <p>
                                {error}
                            </p>

                            <button
                                className="officer-primary-btn"
                                onClick={fetchLoans}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="officer-state">
                            <div className="officer-empty-icon">
                                📭
                            </div>

                            <h3>
                                No applications found
                            </h3>

                            <p>
                                There are no applications matching
                                the selected filter.
                            </p>
                        </div>
                    ) : (
                        <div className="officer-loan-list">

                            {filteredLoans.map((loan) => (

                                <div
                                    className="officer-loan-card"
                                    key={loan._id}
                                    onClick={() =>
                                        navigate(
                                            `/officer/loans/${loan._id}`
                                        )
                                    }
                                >

                                    <div className="officer-loan-main">

                                        <div className="officer-applicant-avatar">
                                            {loan.applicant?.name
                                                ?.charAt(0)
                                                .toUpperCase() ||
                                                "A"}
                                        </div>

                                        <div className="officer-loan-info">

                                            <div className="officer-loan-title">
                                                <h3>
                                                    {loan.applicant
                                                        ?.name ||
                                                        "Applicant"}
                                                </h3>

                                                <StatusBadge
                                                    status={
                                                        loan.status
                                                    }
                                                />
                                            </div>

                                            <p>
                                                {loan.applicant
                                                    ?.email ||
                                                    "No email"}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="officer-loan-details">

                                        <div>
                                            <span>
                                                Loan Type
                                            </span>

                                            <strong>
                                                {getLoanType(
                                                    loan
                                                        .loanDetails
                                                        ?.loanType
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Amount
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    loan
                                                        .loanDetails
                                                        ?.amount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Tenure
                                            </span>

                                            <strong>
                                                {loan
                                                    .loanDetails
                                                    ?.tenure ||
                                                    "—"}{" "}
                                                months
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Submitted
                                            </span>

                                            <strong>
                                                {loan.submittedAt
                                                    ? new Date(
                                                          loan.submittedAt
                                                      ).toLocaleDateString(
                                                          "en-IN"
                                                      )
                                                    : "—"}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="officer-loan-action">
                                        View Application →
                                    </div>

                                </div>

                            ))}

                        </div>
                    )}

                </section>

            </main>
        </div>
    );
};

export default OfficerDashboard;