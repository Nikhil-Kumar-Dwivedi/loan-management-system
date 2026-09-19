import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
        return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

const loanTypes = {
    PERSONAL: "Personal Loan",
    HOME: "Home Loan",
    VEHICLE: "Vehicle Loan",
    BUSINESS: "Business Loan",
};

const AdminLoanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState(null);
    const [documents, setDocuments] = useState([]);

    const [decision, setDecision] =
        useState("");

    const [remarks, setRemarks] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [decisionLoading, setDecisionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const fetchLoan = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/admin/loans/${id}`
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

    const fetchDocuments = async () => {
        try {
            const response = await api.get(
                `/loans/${id}/documents`
            );

            setDocuments(
                response.data.documents || []
            );
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLoan();
        fetchDocuments();
    }, [id]);

    const viewDocument = async (
        documentId
    ) => {
        try {
            const response = await api.get(
                `/loans/documents/${documentId}/view`,
                {
                    responseType: "blob",
                }
            );

            const fileURL =
                URL.createObjectURL(
                    response.data
                );

            window.open(
                fileURL,
                "_blank"
            );
        } catch (err) {
            console.error(err);

            setError(
                "Unable to open document."
            );
        }
    };

    const submitDecision = async () => {
        if (!decision) {
            setError(
                "Please select a final decision."
            );
            return;
        }

        if (!remarks.trim()) {
            setError(
                "Please enter remarks for the final decision."
            );
            return;
        }

        try {
            setDecisionLoading(true);
            setError("");
            setSuccess("");

            const response = await api.post(
                `/admin/loans/${id}/decision`,
                {
                    decision,
                    remarks: remarks.trim(),
                }
            );

            setLoan(
                response.data.loanApplication
            );

            setSuccess(
                decision === "APPROVED"
                    ? "Loan approved successfully. EMI schedule has been generated."
                    : "Loan rejected successfully."
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to submit final decision."
            );
        } finally {
            setDecisionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="app-shell">
                <Navbar />

                <div className="admin-state">
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

                <div className="admin-state">
                    <h3>
                        Application not found
                    </h3>

                    <p>{error}</p>

                    <button
                        className="admin-primary-btn"
                        onClick={() =>
                            navigate("/admin")
                        }
                    >
                        Back to Admin
                    </button>
                </div>
            </div>
        );
    }

    const canDecide =
        loan.status ===
            "OFFICER_RECOMMENDED_APPROVAL" ||
        loan.status ===
            "OFFICER_RECOMMENDED_REJECTION";

    return (
        <div className="app-shell">
            <Navbar />

            <main className="admin-review-page">

                <div className="admin-review-top">

                    <button
                        className="admin-back-btn"
                        onClick={() =>
                            navigate("/admin")
                        }
                    >
                        ← Back to Admin
                    </button>

                    <StatusBadge
                        status={loan.status}
                    />

                </div>

                {/* HEADER */}
                <section className="admin-review-header">

                    <div>
                        <span className="admin-eyebrow">
                            FINAL LOAN DECISION
                        </span>

                        <h1>
                            {loan.applicant?.name ||
                                "Applicant"}
                        </h1>

                        <p>
                            {loan.applicant?.email ||
                                "No email"}
                        </p>
                    </div>

                    <div className="admin-loan-summary">

                        <span>
                            Requested Amount
                        </span>

                        <strong>
                            {formatCurrency(
                                loan.loanDetails
                                    ?.amount
                            )}
                        </strong>

                        <small>
                            {loanTypes[
                                loan.loanDetails
                                    ?.loanType
                            ] ||
                                loan.loanDetails
                                    ?.loanType}
                        </small>

                    </div>

                </section>

                {error && (
                    <div className="admin-message error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="admin-message success">
                        {success}
                    </div>
                )}

                {/* APPLICANT */}
                <section className="admin-review-card">

                    <h2>
                        Applicant Details
                    </h2>

                    <div className="admin-info-grid">

                        <div>
                            <span>
                                Full Name
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.fullName ||
                                    "—"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Date of Birth
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.dateOfBirth
                                    ? new Date(
                                          loan
                                              .personalDetails
                                              .dateOfBirth
                                      ).toLocaleDateString(
                                          "en-IN"
                                      )
                                    : "—"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                PAN
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.panNumber ||
                                    "—"}
                            </strong>
                        </div>

                        <div className="wide">
                            <span>
                                Address
                            </span>

                            <strong>
                                {loan.personalDetails
                                    ?.address ||
                                    "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* LOAN */}
                <section className="admin-review-card">

                    <h2>
                        Loan Details
                    </h2>

                    <div className="admin-info-grid">

                        <div>
                            <span>
                                Loan Type
                            </span>

                            <strong>
                                {loanTypes[
                                    loan.loanDetails
                                        ?.loanType
                                ] ||
                                    loan.loanDetails
                                        ?.loanType}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Loan Amount
                            </span>

                            <strong>
                                {formatCurrency(
                                    loan.loanDetails
                                        ?.amount
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Tenure
                            </span>

                            <strong>
                                {loan.loanDetails
                                    ?.tenure ||
                                    "—"}{" "}
                                months
                            </strong>
                        </div>

                        <div>
                            <span>
                                Interest Rate
                            </span>

                            <strong>
                                {loan.interestRate ??
                                    "—"}
                                %
                            </strong>
                        </div>

                        <div>
                            <span>
                                Estimated EMI
                            </span>

                            <strong>
                                {formatCurrency(
                                    loan.estimatedEMI
                                )}
                            </strong>
                        </div>

                        <div className="wide">
                            <span>
                                Purpose
                            </span>

                            <strong>
                                {loan.loanDetails
                                    ?.purpose ||
                                    "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* INCOME */}
                <section className="admin-review-card">

                    <h2>
                        Income Details
                    </h2>

                    <div className="admin-info-grid">

                        <div>
                            <span>
                                Monthly Income
                            </span>

                            <strong>
                                {formatCurrency(
                                    loan.incomeDetails
                                        ?.monthlyIncome
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Employment Type
                            </span>

                            <strong>
                                {loan.incomeDetails
                                    ?.employmentType ||
                                    "—"}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* OFFICER REVIEW */}
                <section className="admin-review-card officer-recommendation-summary">

                    <div className="admin-card-heading">

                        <div>
                            <h2>
                                Loan Officer Recommendation
                            </h2>

                            <p>
                                This is the recommendation
                                submitted by the Loan Officer.
                            </p>
                        </div>

                        {loan.officerReview
                            ?.recommendation && (
                            <span className="recommendation-pill">
                                {
                                    loan.officerReview
                                        .recommendation
                                }
                            </span>
                        )}

                    </div>

                    <div className="officer-note-display">

                        <span>
                            Officer's Note
                        </span>

                        <p>
                            {loan.officerReview
                                ?.note ||
                                "No note provided."}
                        </p>

                    </div>

                </section>

                {/* DOCUMENTS */}
                <section className="admin-review-card">

                    <div className="admin-card-heading">

                        <div>
                            <h2>
                                Documents
                            </h2>

                            <p>
                                Review applicant documents
                                before making the final
                                decision.
                            </p>
                        </div>

                    </div>

                    {documents.length ===
                    0 ? (
                        <div className="admin-empty-document">
                            No documents available.
                        </div>
                    ) : (
                        <div className="admin-documents">

                            {documents.map(
                                (document) => (
                                    <div
                                        className="admin-document"
                                        key={
                                            document._id
                                        }
                                    >

                                        <span>
                                            📄
                                        </span>

                                        <div>
                                            <strong>
                                                {
                                                    document.originalName
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    document.documentType
                                                }
                                            </small>
                                        </div>

                                        <button
                                            onClick={() =>
                                                viewDocument(
                                                    document._id
                                                )
                                            }
                                        >
                                            View
                                        </button>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>

                {/* FINAL DECISION */}
                <section className="admin-review-card final-decision-card">

                    <div className="admin-card-heading">

                        <div>
                            <span className="admin-section-eyebrow">
                                ADMIN ACTION
                            </span>

                            <h2>
                                Final Decision
                            </h2>

                            <p>
                                This decision determines whether
                                the loan is finally approved or
                                rejected.
                            </p>
                        </div>

                    </div>

                    {!canDecide ? (
                        <div className="admin-decision-locked">

                            <strong>
                                Final decision is not available
                            </strong>

                            <p>
                                This application is currently:
                                <b>
                                    {" "}
                                    {loan.status.replaceAll(
                                        "_",
                                        " "
                                    )}
                                </b>
                            </p>

                        </div>
                    ) : (
                        <>
                            <div className="admin-decision-options">

                                <label
                                    className={`admin-decision-option approve ${
                                        decision ===
                                        "APPROVED"
                                            ? "selected"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="APPROVED"
                                        checked={
                                            decision ===
                                            "APPROVED"
                                        }
                                        onChange={(e) =>
                                            setDecision(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />

                                    <span>
                                        ✓
                                    </span>

                                    <div>
                                        <strong>
                                            Approve Loan
                                        </strong>

                                        <p>
                                            Final approval. An
                                            EMI repayment
                                            schedule will be
                                            generated.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`admin-decision-option reject ${
                                        decision ===
                                        "REJECTED"
                                            ? "selected"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="REJECTED"
                                        checked={
                                            decision ===
                                            "REJECTED"
                                        }
                                        onChange={(e) =>
                                            setDecision(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />

                                    <span>
                                        ✕
                                    </span>

                                    <div>
                                        <strong>
                                            Reject Loan
                                        </strong>

                                        <p>
                                            Final rejection of
                                            the loan application.
                                        </p>
                                    </div>
                                </label>

                            </div>

                            <div className="admin-remarks">

                                <label>
                                    Admin Remarks
                                </label>

                                <textarea
                                    value={
                                        remarks
                                    }
                                    onChange={(e) =>
                                        setRemarks(
                                            e.target
                                                .value
                                        )
                                    }
                                    rows="5"
                                    maxLength={1000}
                                    placeholder="Enter the reason for your final decision..."
                                />

                                <span>
                                    {
                                        remarks.length
                                    }
                                    /1000
                                </span>

                            </div>

                            <button
                                className="admin-final-btn"
                                onClick={
                                    submitDecision
                                }
                                disabled={
                                    decisionLoading
                                }
                            >
                                {decisionLoading
                                    ? "Processing..."
                                    : "Submit Final Decision"}
                            </button>

                        </>
                    )}

                </section>

            </main>
        </div>
    );
};

export default AdminLoanDetails;