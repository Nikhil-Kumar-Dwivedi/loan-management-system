import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

import ApplicantDashboard from "./pages/ApplicantDashboard";
import LoanApplication from "./pages/LoanApplication";
import LoanDetails from "./pages/LoanDetails";

import OfficerDashboard from "./pages/OfficerDashboard";
import OfficerLoanDetails from "./pages/OfficerLoanDetails";

import AdminDashboard from "./pages/AdminDashboard";
import AdminLoanDetails from "./pages/AdminLoanDetails";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>

                {/* PUBLIC */}

                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/signup"
                    element={
                        <PublicRoute>
                            <Signup />
                        </PublicRoute>
                    }
                />

                {/* PROFILE */}

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "APPLICANT",
                                "LOAN_OFFICER",
                                "ADMIN",
                            ]}
                        >
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* APPLICANT */}

                <Route
                    path="/applicant"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "APPLICANT",
                            ]}
                        >
                            <ApplicantDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/applicant/apply"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "APPLICANT",
                            ]}
                        >
                            <LoanApplication />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/applicant/apply/:id"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "APPLICANT",
                            ]}
                        >
                            <LoanApplication />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/applicant/loans/:id"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "APPLICANT",
                            ]}
                        >
                            <LoanDetails />
                        </ProtectedRoute>
                    }
                />

                {/* LOAN OFFICER */}

                <Route
                    path="/officer"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "LOAN_OFFICER",
                            ]}
                        >
                            <OfficerDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/officer/loans/:id"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "LOAN_OFFICER",
                            ]}
                        >
                            <OfficerLoanDetails />
                        </ProtectedRoute>
                    }
                />

                {/* ADMIN */}

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "ADMIN",
                            ]}
                        >
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/loans/:id"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "ADMIN",
                            ]}
                        >
                            <AdminLoanDetails />
                        </ProtectedRoute>
                    }
                />

                {/* DEFAULT */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
};

export default App;