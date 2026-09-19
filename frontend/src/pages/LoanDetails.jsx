import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const loanTypeNames = {
    PERSONAL: "Personal Loan",
    HOME: "Home Loan",
    VEHICLE: "Vehicle Loan",
    BUSINESS: "Business Loan",
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
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

const LoanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState(null);
    const [emiSchedule, setEmiSchedule] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [emiLoading, setEmiLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [emiError, setEmiError] =
        useState("");

    const fetchLoan = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/loans/${id}`
            );

            setLoan(
                response.data.loanApplication
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load loan application."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchEMISchedule = async () => {
        try {
            setEmiLoading(true);
            setEmiError("");

            const response = await api.get(
                `/loans/${id}/emi`
            );

            setEmiSchedule(
                response.data.emiSchedule || []
            );

        } catch (err) {
            console.error(err);

            setEmiSchedule([]);

            setEmiError(
                err.response?.data?.message ||
                    "Unable to load EMI schedule."
            );
        } finally {
            setEmiLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchLoan();
        };

        loadData();
    }, [id]);

    useEffect(() => {
        if (loan?.status === "APPROVED") {
            fetchEMISchedule();
        }
    }, [loan?.status, id]);

    const emiSummary = useMemo(() => {
        if (!emiSchedule.length) {
            return {
                total: 0,
                paid: 0,
                pending: 0,
                overdue: 0,
            };
        }

        return {
            total: emiSchedule.length,

            paid: emiSchedule.filter(
                (emi) =>
                    emi.status === "PAID"
            ).length,

            pending: emiSchedule.filter(
                (emi) =>
                    emi.status === "PENDING"
            ).length,

            overdue: emiSchedule.filter(
                (emi) =>
                    emi.status === "OVERDUE"
            ).length,
        };
    }, [emiSchedule]);

    if (loading) {
        return (
            <div className="app-shell">
                <Navbar />

                <div className="loan-details-state">
                    <div className="loader"></div>
                    <p>
                        Loading application...
                    </p>
                </div>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="app-shell">
                <Navbar />

                <div className="loan-details-state">

                    <div className="loan-state-icon">
                        ⚠️
                    </div>

                    <h2>
                        Application not found
                    </h2>

                    <p>
                        {error ||
                            "Unable to find this application."}
                    </p>

                    <button
                        className="loan-back-button"
                        onClick={() =>
                            navigate(
                                "/applicant"
                            )
                        }
                    >
                        ← Back to Dashboard
                    </button>

                </div>
            </div>
        );
    }

    const loanType =
        loan.loanDetails?.loanType;

    const isApproved =
        loan.status === "APPROVED";

    return (
        <div className="app-shell">
            <Navbar />

            <main className="loan-details-page">

                {/* BACK */}
                <button
                    className="loan-details-back"
                    onClick={() =>
                        navigate(
                            "/applicant"
                        )
                    }
                >
                    ← Back to Dashboard
                </button>

                {/* HEADER */}
                <section className="loan-details-hero">

                    <div>

                        <span className="loan-details-eyebrow">
                            LOAN APPLICATION
                        </span>

                        <h1>
                            {loanTypeNames[
                                loanType
                            ] ||
                                loanType ||
                                "Loan Application"}
                        </h1>

                        <p>
                            Application ID:{" "}
                            <span>
                                {loan._id}
                            </span>
                        </p>

                    </div>

                    <StatusBadge
                        status={loan.status}
                    />

                </section>

                {/* ERROR */}
                {error && (
                    <div className="loan-details-error">
                        {error}
                    </div>
                )}

                {/* APPLICATION DETAILS */}
                <section className="loan-details-card">

                    <h2>
                        Application Details
                    </h2>

                    <div className="loan-info-grid">

                        <div className="loan-info-item">
                            <span>
                                LOAN TYPE
                            </span>

                            <strong>
                                {loanTypeNames[
                                    loanType
                                ] ||
                                    loanType ||
                                    "—"}
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                LOAN AMOUNT
                            </span>

                            <strong>
                                {formatCurrency(
                                    loan.loanDetails
                                        ?.amount
                                )}
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                TENURE
                            </span>

                            <strong>
                                {loan.loanDetails
                                    ?.tenure ||
                                    "—"}{" "}
                                months
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                INTEREST RATE
                            </span>

                            <strong>
                                {loan.interestRate ??
                                    "—"}
                                %
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                ESTIMATED EMI
                            </span>

                            <strong>
                                {formatCurrency(
                                    loan.estimatedEMI
                                )}
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                PURPOSE
                            </span>

                            <strong>
                                {loan.loanDetails
                                    ?.purpose ||
                                    "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* APPLICANT DETAILS */}
                <section className="loan-details-card">

                    <h2>
                        Applicant Details
                    </h2>

                    <div className="loan-info-grid">

                        <div className="loan-info-item">
                            <span>
                                FULL NAME
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.fullName ||
                                    "—"}
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                DATE OF BIRTH
                            </span>

                            <strong>
                                {formatDate(
                                    loan
                                        .personalDetails
                                        ?.dateOfBirth
                                )}
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                PAN NUMBER
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.panNumber ||
                                    "—"}
                            </strong>
                        </div>

                        <div className="loan-info-item wide">
                            <span>
                                ADDRESS
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.address ||
                                    "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* INCOME */}
                <section className="loan-details-card">

                    <h2>
                        Income Details
                    </h2>

                    <div className="loan-info-grid">

                        <div className="loan-info-item">
                            <span>
                                MONTHLY INCOME
                            </span>

                            <strong>
                                {formatCurrency(
                                    loan
                                        .incomeDetails
                                        ?.monthlyIncome
                                )}
                            </strong>
                        </div>

                        <div className="loan-info-item">
                            <span>
                                EMPLOYMENT TYPE
                            </span>

                            <strong>
                                {loan
                                    .incomeDetails
                                    ?.employmentType ||
                                    "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* OFFICER RECOMMENDATION */}
                {loan.officerReview
                    ?.recommendation && (
                    <section className="loan-details-card">

                        <h2>
                            Loan Officer Review
                        </h2>

                        <div className="loan-review-box">

                            <div>
                                <span>
                                    RECOMMENDATION
                                </span>

                                <strong>
                                    {loan
                                        .officerReview
                                        .recommendation ===
                                    "APPROVAL"
                                        ? "Recommended for Approval"
                                        : loan
                                              .officerReview
                                              .recommendation ===
                                          "REJECTION"
                                        ? "Recommended for Rejection"
                                        : "More Information Requested"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    OFFICER NOTE
                                </span>

                                <p>
                                    {loan
                                        .officerReview
                                        .note ||
                                        "—"}
                                </p>
                            </div>

                        </div>

                    </section>
                )}

                {/* APPROVED LOAN / EMI */}
                {isApproved && (
                    <section className="emi-section">

                        <div className="emi-section-header">

                            <div>

                                <span className="loan-details-eyebrow">
                                    REPAYMENT
                                </span>

                                <h2>
                                    EMI Schedule
                                </h2>

                                <p>
                                    Your loan has been
                                    approved. Here is your
                                    complete repayment
                                    schedule.
                                </p>

                            </div>

                            <div className="emi-approved-badge">
                                ✓ Loan Approved
                            </div>

                        </div>

                        {emiLoading ? (
                            <div className="emi-loading">
                                <div className="loader"></div>

                                <p>
                                    Loading EMI schedule...
                                </p>
                            </div>
                        ) : emiError ? (
                            <div className="emi-error">
                                {emiError}
                            </div>
                        ) : emiSchedule.length ===
                          0 ? (
                            <div className="emi-empty">
                                <div>
                                    📊
                                </div>

                                <h3>
                                    EMI schedule not
                                    available yet
                                </h3>

                                <p>
                                    The loan is approved,
                                    but the repayment
                                    schedule has not been
                                    generated yet.
                                </p>

                            </div>
                        ) : (
                            <>
                                {/* EMI SUMMARY */}
                                <div className="emi-summary">

                                    <div className="emi-summary-card">

                                        <span>
                                            Total EMIs
                                        </span>

                                        <strong>
                                            {
                                                emiSummary.total
                                            }
                                        </strong>

                                    </div>

                                    <div className="emi-summary-card">

                                        <span>
                                            Monthly EMI
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                emiSchedule[0]
                                                    ?.emiAmount
                                            )}
                                        </strong>

                                    </div>

                                    <div className="emi-summary-card">

                                        <span>
                                            Interest Rate
                                        </span>

                                        <strong>
                                            {
                                                loan.interestRate
                                            }
                                            %
                                        </strong>

                                    </div>

                                    <div className="emi-summary-card">

                                        <span>
                                            Paid
                                        </span>

                                        <strong>
                                            {
                                                emiSummary.paid
                                            }
                                        </strong>

                                    </div>

                                </div>

                                {/* TABLE */}
                                <div className="emi-table-wrapper">

                                    <table className="emi-table">

                                        <thead>
                                            <tr>

                                                <th>
                                                    #
                                                </th>

                                                <th>
                                                    Due Date
                                                </th>

                                                <th>
                                                    Principal
                                                </th>

                                                <th>
                                                    Interest
                                                </th>

                                                <th>
                                                    EMI
                                                </th>

                                                <th>
                                                    Remaining
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                            </tr>
                                        </thead>

                                        <tbody>

                                            {emiSchedule.map(
                                                (emi) => (
                                                    <tr
                                                        key={
                                                            emi._id ||
                                                            emi.installmentNumber
                                                        }
                                                    >

                                                        <td>
                                                            <strong>
                                                                {
                                                                    emi.installmentNumber
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                formatDate(
                                                                    emi.dueDate
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                formatCurrency(
                                                                    emi.principalAmount
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                formatCurrency(
                                                                    emi.interestAmount
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {
                                                                    formatCurrency(
                                                                        emi.emiAmount
                                                                    )
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                formatCurrency(
                                                                    emi.remainingBalance
                                                                )
                                                            }
                                                        </td>

                                                        <td>

                                                            <span
                                                                className={`emi-status ${
                                                                    emi.status
                                                                        ?.toLowerCase()
                                                                        .replace(
                                                                            "_",
                                                                            "-"
                                                                        ) ||
                                                                    "pending"
                                                                }`}
                                                            >
                                                                {
                                                                    emi.status
                                                                }
                                                            </span>

                                                        </td>

                                                    </tr>
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>
                            </>
                        )}

                    </section>
                )}

                {/* REJECTED */}
                {loan.status ===
                    "REJECTED" && (
                    <section className="loan-decision-box rejected">

                        <div>
                            ✕
                        </div>

                        <div>
                            <h3>
                                Loan Application Rejected
                            </h3>

                            <p>
                                Your application has
                                received the final decision
                                from the Administrator.
                            </p>

                            {loan.adminReview
                                ?.remarks && (
                                <p>
                                    <strong>
                                        Remarks:
                                    </strong>{" "}
                                    {
                                        loan.adminReview
                                            .remarks
                                    }
                                </p>
                            )}
                        </div>

                    </section>
                )}

            </main>
        </div>
    );
};

export default LoanDetails;