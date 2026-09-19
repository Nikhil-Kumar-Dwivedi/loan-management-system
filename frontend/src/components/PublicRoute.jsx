import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    if (user.role === "APPLICANT") {
      return <Navigate to="/applicant" replace />;
    }

    if (user.role === "LOAN_OFFICER") {
      return <Navigate to="/officer" replace />;
    }

    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default PublicRoute;