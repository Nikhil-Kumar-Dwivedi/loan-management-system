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

const loanTypeLabel = {
    PERSONAL: "Personal Loan",
    HOME: "Home Loan",
    VEHICLE: "Vehicle Loan",
    BUSINESS: "Business Loan",
};

const OfficerLoanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState(null);
    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [documentLoading, setDocumentLoading] =
        useState(true);

    const [eligibilityLoading, setEligibilityLoading] =
        useState(false);

    const [reviewLoading, setReviewLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [recommendation, setRecommendation] =
        useState("");

    const [note, setNote] = useState("");

    const fetchLoan = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/officer/loans/${id}`
            );

            const application =
                response.data.loanApplication;

            setLoan(application);

            /*
             * If an officer has already made a recommendation,
             * show it.
             */
            if (
                application.officerReview?.recommendation
            ) {
                setRecommendation(
                    application.officerReview
                        .recommendation
                );
            }

            if (application.officerReview?.note) {
                setNote(
                    application.officerReview.note
                );
            }
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load application."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            setDocumentLoading(true);

            const response = await api.get(
                `/loans/${id}/documents`
            );

            setDocuments(
                response.data.documents || []
            );
        } catch (err) {
            console.error(err);
        } finally {
            setDocumentLoading(false);
        }
    };

    useEffect(() => {
        fetchLoan();
        fetchDocuments();
    }, [id]);

    const runEligibilityCheck = async () => {
        try {
            setEligibilityLoading(true);
            setError("");
            setSuccess("");

            const response = await api.post(
                `/officer/loans/${id}/eligibility`
            );

            setLoan(
                response.data.loanApplication
            );

            setSuccess(
                "Eligibility check completed successfully."
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Eligibility check failed."
            );
        } finally {
            setEligibilityLoading(false);
        }
    };

    const submitRecommendation = async () => {
        if (!recommendation) {
            setError(
                "Please select a recommendation."
            );
            return;
        }

        if (!note.trim()) {
            setError(
                "Please enter a review note."
            );
            return;
        }

        try {
            setReviewLoading(true);
            setError("");
            setSuccess("");

            const response = await api.post(
                `/officer/loans/${id}/review`,
                {
                    recommendation,
                    note: note.trim(),
                }
            );

            setLoan(
                response.data.loanApplication
            );

            setSuccess(
                "Recommendation submitted successfully."
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to submit recommendation."
            );
        } finally {
            setReviewLoading(false);
        }
    };

    const viewDocument = async (documentId) => {
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
                "Unable to open this document."
            );
        }
    };

    if (loading) {
        return (
            <div className="app-shell">
                <Navbar />

                <div className="officer-state">
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

                <div className="officer-state error">
                    <h3>
                        Application not found
                    </h3>

                    <p>{error}</p>

                    <button
                        className="officer-primary-btn"
                        onClick={() =>
                            navigate("/officer")
                        }
                    >
                        Back to Applications
                    </button>
                </div>
            </div>
        );
    }

    const eligibility =
        loan.eligibilityResult;

    const canReview =
        loan.status === "UNDER_REVIEW";

    return (
        <div className="app-shell">
            <Navbar />

            <main className="officer-review-page">

                {/* TOP */}
                <div className="officer-review-top">

                    <button
                        className="officer-back-btn"
                        onClick={() =>
                            navigate("/officer")
                        }
                    >
                        ← Back to Applications
                    </button>

                    <div>
                        <StatusBadge
                            status={loan.status}
                        />
                    </div>

                </div>

                {/* HEADER */}
                <section className="officer-review-header">

                    <div>
                        <span className="officer-eyebrow">
                            APPLICATION REVIEW
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

                    <div className="review-loan-summary">

                        <span>
                            Requested Amount
                        </span>

                        <strong>
                            {formatCurrency(
                                loan.loanDetails?.amount
                            )}
                        </strong>

                        <small>
                            {loanTypeLabel[
                                loan.loanDetails
                                    ?.loanType
                            ] ||
                                loan.loanDetails
                                    ?.loanType}
                        </small>

                    </div>

                </section>

                {error && (
                    <div className="officer-message error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="officer-message success">
                        {success}
                    </div>
                )}

                {/* PERSONAL DETAILS */}
                <section className="review-card">

                    <div className="review-card-header">
                        <h2>
                            Applicant Details
                        </h2>
                    </div>

                    <div className="review-info-grid">

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
                                PAN Number
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

                {/* LOAN DETAILS */}
                <section className="review-card">

                    <div className="review-card-header">
                        <h2>
                            Loan Details
                        </h2>
                    </div>

                    <div className="review-info-grid">

                        <div>
                            <span>
                                Loan Type
                            </span>

                            <strong>
                                {loanTypeLabel[
                                    loan.loanDetails
                                        ?.loanType
                                ] ||
                                    loan.loanDetails
                                        ?.loanType ||
                                    "—"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Amount
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
                <section className="review-card">

                    <div className="review-card-header">
                        <h2>
                            Income Details
                        </h2>
                    </div>

                    <div className="review-info-grid">

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

                {/* DOCUMENTS */}
                <section className="review-card">

                    <div className="review-card-header">
                        <div>
                            <h2>
                                Documents
                            </h2>

                            <p>
                                Review the documents
                                submitted by the applicant.
                            </p>
                        </div>
                    </div>

                    {documentLoading ? (
                        <p>
                            Loading documents...
                        </p>
                    ) : documents.length === 0 ? (
                        <div className="document-empty">
                            No documents found.
                        </div>
                    ) : (
                        <div className="review-documents">

                            {documents.map(
                                (document) => (
                                    <div
                                        className="review-document"
                                        key={
                                            document._id
                                        }
                                    >

                                        <div className="document-icon">
                                            📄
                                        </div>

                                        <div>
                                            <strong>
                                                {
                                                    document.originalName
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    document.documentType
                                                }
                                            </span>
                                        </div>

                                        <button
                                            className="document-view-btn"
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

                {/* ELIGIBILITY */}
                <section className="review-card">

                    <div className="review-card-header">

                        <div>
                            <h2>
                                Eligibility Check
                            </h2>

                            <p>
                                Run the deterministic eligibility
                                checks before making a recommendation.
                            </p>
                        </div>

                        <button
                            className="officer-primary-btn"
                            onClick={
                                runEligibilityCheck
                            }
                            disabled={
                                eligibilityLoading
                            }
                        >
                            {eligibilityLoading
                                ? "Checking..."
                                : eligibility
                                ?.checked
                                ? "Run Again"
                                : "Check Eligibility"}
                        </button>

                    </div>

                    {eligibility?.checked ? (
                        <div className="eligibility-area">

                            <div
                                className={`eligibility-result ${
                                    eligibility.eligible
                                        ? "passed"
                                        : "failed"
                                }`}
                            >
                                <strong>
                                    {eligibility.eligible
                                        ? "✓ Eligible"
                                        : "✕ Not Eligible"}
                                </strong>

                                <span>
                                    Eligibility result based
                                    on the configured rules.
                                </span>
                            </div>

                            <div className="eligibility-checks">

                                {eligibility.checks?.map(
                                    (check, index) => (
                                        <div
                                            className={`eligibility-check ${
                                                check.passed
                                                    ? "passed"
                                                    : "failed"
                                            }`}
                                            key={index}
                                        >

                                            <span>
                                                {check.passed
                                                    ? "✓"
                                                    : "✕"}
                                            </span>

                                            <div>
                                                <strong>
                                                    {
                                                        check.rule
                                                    }
                                                </strong>

                                                <p>
                                                    {
                                                        check.message
                                                    }
                                                </p>
                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                        </div>
                    ) : (
                        <div className="eligibility-not-run">
                            Eligibility check has not been
                            performed yet.
                        </div>
                    )}

                </section>

                {/* OFFICER RECOMMENDATION */}
                <section className="review-card recommendation-card">

                    <div className="review-card-header">

                        <div>
                            <h2>
                                Officer Recommendation
                            </h2>

                            <p>
                                Your recommendation will be sent
                                to the Admin for the final decision.
                            </p>
                        </div>

                    </div>

                    {!canReview ? (
                        <div className="recommendation-locked">
                            <strong>
                                Recommendation unavailable
                            </strong>

                            <p>
                                This application is currently
                                <b>
                                    {" "}
                                    {loan.status.replaceAll(
                                        "_",
                                        " "
                                    )}
                                </b>
                                .
                            </p>

                            {loan.officerReview
                                ?.recommendation && (
                                <p>
                                    Officer recommendation:{" "}
                                    <b>
                                        {
                                            loan
                                                .officerReview
                                                .recommendation
                                        }
                                    </b>
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="recommendation-options">

                                <label
                                    className={`recommendation-option approval ${
                                        recommendation ===
                                        "APPROVAL"
                                            ? "selected"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="APPROVAL"
                                        checked={
                                            recommendation ===
                                            "APPROVAL"
                                        }
                                        onChange={(e) =>
                                            setRecommendation(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span className="recommendation-symbol">
                                        ✓
                                    </span>

                                    <div>
                                        <strong>
                                            Recommended for
                                            Approval
                                        </strong>

                                        <p>
                                            Send the application
                                            to Admin for final
                                            approval.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`recommendation-option rejection ${
                                        recommendation ===
                                        "REJECTION"
                                            ? "selected"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="REJECTION"
                                        checked={
                                            recommendation ===
                                            "REJECTION"
                                        }
                                        onChange={(e) =>
                                            setRecommendation(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span className="recommendation-symbol">
                                        ✕
                                    </span>

                                    <div>
                                        <strong>
                                            Recommended for
                                            Rejection
                                        </strong>

                                        <p>
                                            Send the rejection
                                            recommendation to
                                            Admin for final
                                            decision.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`recommendation-option more-info ${
                                        recommendation ===
                                        "MORE_INFO"
                                            ? "selected"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="recommendation"
                                        value="MORE_INFO"
                                        checked={
                                            recommendation ===
                                            "MORE_INFO"
                                        }
                                        onChange={(e) =>
                                            setRecommendation(
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span className="recommendation-symbol">
                                        ℹ
                                    </span>

                                    <div>
                                        <strong>
                                            Request More
                                            Information
                                        </strong>

                                        <p>
                                            Ask the applicant to
                                            provide additional
                                            information or
                                            documents.
                                        </p>
                                    </div>
                                </label>

                            </div>

                            <div className="review-note">

                                <label>
                                    Review Note
                                </label>

                                <textarea
                                    value={note}
                                    onChange={(e) =>
                                        setNote(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter the reason for your recommendation or the additional information required..."
                                    rows="5"
                                    maxLength={1000}
                                />

                                <span>
                                    {note.length}/1000
                                </span>

                            </div>

                            <button
                                className="officer-submit-btn"
                                onClick={
                                    submitRecommendation
                                }
                                disabled={
                                    reviewLoading
                                }
                            >
                                {reviewLoading
                                    ? "Submitting..."
                                    : "Submit Recommendation"}
                            </button>
                        </>
                    )}

                </section>

            </main>
        </div>
    );
};

export default OfficerLoanDetails;