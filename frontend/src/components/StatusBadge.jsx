const statusConfig = {
  DRAFT: {
    label: "Draft",
    className: "status-draft",
  },

  SUBMITTED: {
    label: "Submitted",
    className: "status-submitted",
  },

  UNDER_REVIEW: {
    label: "Under Review",
    className: "status-review",
  },

  MORE_INFO_NEEDED: {
    label: "More Info Needed",
    className: "status-warning",
  },

  OFFICER_RECOMMENDED_APPROVAL: {
    label: "Recommended for Approval",
    className: "status-review",
  },

  OFFICER_RECOMMENDED_REJECTION: {
    label: "Recommended for Rejection",
    className: "status-warning",
  },

  APPROVED: {
    label: "Approved",
    className: "status-approved",
  },

  REJECTED: {
    label: "Rejected",
    className: "status-rejected",
  },
};

const StatusBadge = ({ status }) => {
  const config =
    statusConfig[status] || {
      label: status,
      className: "status-draft",
    };

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-dot"></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;