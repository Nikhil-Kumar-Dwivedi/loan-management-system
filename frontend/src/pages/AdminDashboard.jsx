import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("applications");

    const [users, setUsers] = useState([]);
    const [loans, setLoans] = useState([]);

    const [usersLoading, setUsersLoading] =
        useState(false);

    const [loansLoading, setLoansLoading] =
        useState(false);

    const [error, setError] = useState("");

    const [userSearch, setUserSearch] =
        useState("");

    const [loanSearch, setLoanSearch] =
        useState("");

    const [roleFilter, setRoleFilter] =
        useState("ALL");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [roleUpdating, setRoleUpdating] =
        useState("");

    const [activeUpdating, setActiveUpdating] =
        useState("");

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            setError("");

            const response = await api.get(
                "/admin/users",
                {
                    params: {
                        limit: 50,
                    },
                }
            );

            setUsers(response.data.users || []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load users."
            );
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchLoans = async () => {
        try {
            setLoansLoading(true);
            setError("");

            const response = await api.get(
                "/admin/loans",
                {
                    params: {
                        limit: 50,
                    },
                }
            );

            setLoans(response.data.loans || []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to load applications."
            );
        } finally {
            setLoansLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchLoans();
    }, []);

    const filteredUsers = useMemo(() => {
        const query =
            userSearch.trim().toLowerCase();

        return users.filter((user) => {
            const matchesSearch =
                !query ||
                user.name
                    ?.toLowerCase()
                    .includes(query) ||
                user.email
                    ?.toLowerCase()
                    .includes(query);

            const matchesRole =
                roleFilter === "ALL" ||
                user.role === roleFilter;

            return (
                matchesSearch &&
                matchesRole
            );
        });
    }, [users, userSearch, roleFilter]);

    const filteredLoans = useMemo(() => {
        const query =
            loanSearch.trim().toLowerCase();

        return loans.filter((loan) => {
            const applicantName =
                loan.applicant?.name
                    ?.toLowerCase() || "";

            const applicantEmail =
                loan.applicant?.email
                    ?.toLowerCase() || "";

            const loanType =
                loan.loanDetails?.loanType
                    ?.toLowerCase() || "";

            const matchesSearch =
                !query ||
                applicantName.includes(query) ||
                applicantEmail.includes(query) ||
                loanType.includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                loan.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [loans, loanSearch, statusFilter]);

    const stats = useMemo(() => {
        return {
            totalUsers: users.length,

            applicants: users.filter(
                (user) =>
                    user.role === "APPLICANT"
            ).length,

            officers: users.filter(
                (user) =>
                    user.role === "LOAN_OFFICER"
            ).length,

            admins: users.filter(
                (user) =>
                    user.role === "ADMIN"
            ).length,

            pendingDecision: loans.filter(
                (loan) =>
                    loan.status ===
                        "OFFICER_RECOMMENDED_APPROVAL" ||
                    loan.status ===
                        "OFFICER_RECOMMENDED_REJECTION"
            ).length,

            approved: loans.filter(
                (loan) =>
                    loan.status === "APPROVED"
            ).length,

            rejected: loans.filter(
                (loan) =>
                    loan.status === "REJECTED"
            ).length,
        };
    }, [users, loans]);

    const updateUserRole = async (
        userId,
        newRole
    ) => {
        try {
            setRoleUpdating(userId);
            setError("");

            const response = await api.patch(
                `/admin/users/${userId}`,
                {
                    role: newRole,
                }
            );

            const updatedUser =
                response.data.user;

            setUsers((currentUsers) =>
                currentUsers.map((user) =>
                    user._id === userId
                        ? updatedUser
                        : user
                )
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to update user role."
            );
        } finally {
            setRoleUpdating("");
        }
    };

    const toggleUserStatus = async (
        user
    ) => {
        try {
            setActiveUpdating(user._id);
            setError("");

            const response = await api.patch(
                `/admin/users/${user._id}`,
                {
                    isActive:
                        !user.isActive,
                }
            );

            const updatedUser =
                response.data.user;

            setUsers((currentUsers) =>
                currentUsers.map((item) =>
                    item._id === user._id
                        ? updatedUser
                        : item
                )
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                    "Unable to update user status."
            );
        } finally {
            setActiveUpdating("");
        }
    };

    return (
        <div className="app-shell">
            <Navbar />

            <main className="admin-page">

                {/* HEADER */}
                <section className="admin-header">

                    <div>
                        <span className="admin-eyebrow">
                            ADMINISTRATION
                        </span>

                        <h1>
                            Admin Dashboard
                        </h1>

                        <p>
                            Manage users and make the final
                            decision on loan applications
                            recommended by Loan Officers.
                        </p>
                    </div>

                    <button
                        className="admin-refresh-btn"
                        onClick={() => {
                            fetchUsers();
                            fetchLoans();
                        }}
                    >
                        ↻ Refresh
                    </button>

                </section>

                {/* STATS */}
                <section className="admin-stats">

                    <div className="admin-stat-card">
                        <span>👥</span>
                        <div>
                            <small>
                                Total Users
                            </small>
                            <strong>
                                {stats.totalUsers}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <span>👤</span>
                        <div>
                            <small>
                                Applicants
                            </small>
                            <strong>
                                {stats.applicants}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <span>🔍</span>
                        <div>
                            <small>
                                Loan Officers
                            </small>
                            <strong>
                                {stats.officers}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <span>🛡️</span>
                        <div>
                            <small>
                                Admins
                            </small>
                            <strong>
                                {stats.admins}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stat-card highlight">
                        <span>⚖️</span>
                        <div>
                            <small>
                                Final Decisions
                            </small>
                            <strong>
                                {stats.pendingDecision}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stat-card approved">
                        <span>✓</span>
                        <div>
                            <small>
                                Approved
                            </small>
                            <strong>
                                {stats.approved}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stat-card rejected">
                        <span>✕</span>
                        <div>
                            <small>
                                Rejected
                            </small>
                            <strong>
                                {stats.rejected}
                            </strong>
                        </div>
                    </div>

                </section>

                {error && (
                    <div className="admin-error">
                        {error}
                    </div>
                )}

                {/* TABS */}
                <div className="admin-tabs">

                    <button
                        className={
                            activeTab ===
                            "applications"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab(
                                "applications"
                            )
                        }
                    >
                        📋 Loan Applications
                    </button>

                    <button
                        className={
                            activeTab === "users"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab("users")
                        }
                    >
                        👥 User Management
                    </button>

                </div>

                {/* APPLICATIONS */}
                {activeTab ===
                    "applications" && (
                    <section className="admin-section">

                        <div className="admin-section-header">

                            <div>
                                <span className="admin-section-eyebrow">
                                    FINAL REVIEW
                                </span>

                                <h2>
                                    Loan Applications
                                </h2>

                                <p>
                                    Review Loan Officer
                                    recommendations and make
                                    the final approval or
                                    rejection decision.
                                </p>
                            </div>

                            <div className="admin-filters">

                                <div className="admin-search">
                                    🔎

                                    <input
                                        type="text"
                                        placeholder="Search applicant..."
                                        value={
                                            loanSearch
                                        }
                                        onChange={(e) =>
                                            setLoanSearch(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <select
                                    value={
                                        statusFilter
                                    }
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target
                                                .value
                                        )
                                    }
                                >
                                    <option value="ALL">
                                        All Status
                                    </option>

                                    <option value="OFFICER_RECOMMENDED_APPROVAL">
                                        Awaiting Approval
                                    </option>

                                    <option value="OFFICER_RECOMMENDED_REJECTION">
                                        Awaiting Rejection
                                    </option>

                                    <option value="APPROVED">
                                        Approved
                                    </option>

                                    <option value="REJECTED">
                                        Rejected
                                    </option>
                                </select>

                            </div>

                        </div>

                        {loansLoading ? (
                            <div className="admin-state">
                                <div className="loader"></div>
                                <p>
                                    Loading applications...
                                </p>
                            </div>
                        ) : filteredLoans.length ===
                          0 ? (
                            <div className="admin-state">
                                <div className="admin-empty-icon">
                                    📭
                                </div>

                                <h3>
                                    No applications found
                                </h3>

                                <p>
                                    There are no applications
                                    matching this filter.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-loan-list">

                                {filteredLoans.map(
                                    (loan) => {

                                        const canDecide =
                                            loan.status ===
                                                "OFFICER_RECOMMENDED_APPROVAL" ||
                                            loan.status ===
                                                "OFFICER_RECOMMENDED_REJECTION";

                                        return (
                                            <div
                                                key={
                                                    loan._id
                                                }
                                                className={`admin-loan-card ${
                                                    canDecide
                                                        ? "decision-needed"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/loans/${loan._id}`
                                                    )
                                                }
                                            >

                                                <div className="admin-loan-person">

                                                    <div className="admin-avatar">
                                                        {loan
                                                            .applicant
                                                            ?.name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            .toUpperCase() ||
                                                            "A"}
                                                    </div>

                                                    <div>
                                                        <h3>
                                                            {loan
                                                                .applicant
                                                                ?.name ||
                                                                "Applicant"}
                                                        </h3>

                                                        <p>
                                                            {loan
                                                                .applicant
                                                                ?.email ||
                                                                "No email"}
                                                        </p>
                                                    </div>

                                                </div>

                                                <div className="admin-loan-info">

                                                    <div>
                                                        <small>
                                                            Loan Type
                                                        </small>

                                                        <strong>
                                                            {
                                                                loan
                                                                    .loanDetails
                                                                    ?.loanType
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <small>
                                                            Amount
                                                        </small>

                                                        <strong>
                                                            ₹
                                                            {Number(
                                                                loan
                                                                    .loanDetails
                                                                    ?.amount ||
                                                                    0
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <small>
                                                            Officer
                                                            Recommendation
                                                        </small>

                                                        <strong>
                                                            {loan
                                                                .officerReview
                                                                ?.recommendation ||
                                                                "—"}
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="admin-loan-status">

                                                    <StatusBadge
                                                        status={
                                                            loan.status
                                                        }
                                                    />

                                                    <span>
                                                        View →
                                                    </span>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </section>
                )}

                {/* USERS */}
                {activeTab === "users" && (
                    <section className="admin-section">

                        <div className="admin-section-header">

                            <div>
                                <span className="admin-section-eyebrow">
                                    ACCESS CONTROL
                                </span>

                                <h2>
                                    All Users
                                </h2>

                                <p>
                                    Manage Applicants, Loan
                                    Officers and Administrators.
                                </p>
                            </div>

                            <div className="admin-filters">

                                <div className="admin-search">
                                    🔎

                                    <input
                                        type="text"
                                        placeholder="Search name or email..."
                                        value={
                                            userSearch
                                        }
                                        onChange={(e) =>
                                            setUserSearch(
                                                e.target
                                                    .value
                                            )
                                        }
                                    />
                                </div>

                                <select
                                    value={
                                        roleFilter
                                    }
                                    onChange={(e) =>
                                        setRoleFilter(
                                            e.target
                                                .value
                                        )
                                    }
                                >
                                    <option value="ALL">
                                        All Roles
                                    </option>

                                    <option value="APPLICANT">
                                        Applicants
                                    </option>

                                    <option value="LOAN_OFFICER">
                                        Loan Officers
                                    </option>

                                    <option value="ADMIN">
                                        Admins
                                    </option>
                                </select>

                            </div>

                        </div>

                        {usersLoading ? (
                            <div className="admin-state">
                                <div className="loader"></div>

                                <p>
                                    Loading users...
                                </p>
                            </div>
                        ) : filteredUsers.length ===
                          0 ? (
                            <div className="admin-state">
                                <div className="admin-empty-icon">
                                    👥
                                </div>

                                <h3>
                                    No users found
                                </h3>

                                <p>
                                    No users match the
                                    selected filter.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-users-list">

                                {filteredUsers.map(
                                    (user) => (
                                        <div
                                            className="admin-user-card"
                                            key={
                                                user._id
                                            }
                                        >

                                            <div className="admin-user-main">

                                                <div className="admin-avatar">
                                                    {user.name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h3>
                                                        {
                                                            user.name
                                                        }
                                                    </h3>

                                                    <p>
                                                        {
                                                            user.email
                                                        }
                                                    </p>
                                                </div>

                                            </div>

                                            <div className="admin-user-role">

                                                <span>
                                                    Current Role
                                                </span>

                                                <select
                                                    value={
                                                        user.role
                                                    }
                                                    disabled={
                                                        roleUpdating ===
                                                        user._id
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        updateUserRole(
                                                            user._id,
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="APPLICANT">
                                                        Applicant
                                                    </option>

                                                    <option value="LOAN_OFFICER">
                                                        Loan Officer
                                                    </option>

                                                    <option value="ADMIN">
                                                        Admin
                                                    </option>
                                                </select>

                                            </div>

                                            <div className="admin-user-status">

                                                <span
                                                    className={
                                                        user.isActive
                                                            ? "user-active"
                                                            : "user-inactive"
                                                    }
                                                >
                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>

                                                <button
                                                    className="user-toggle-btn"
                                                    disabled={
                                                        activeUpdating ===
                                                        user._id
                                                    }
                                                    onClick={() =>
                                                        toggleUserStatus(
                                                            user
                                                        )
                                                    }
                                                >
                                                    {user.isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </section>
                )}

            </main>
        </div>
    );
};

export default AdminDashboard;