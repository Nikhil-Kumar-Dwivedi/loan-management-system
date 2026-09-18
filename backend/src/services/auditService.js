const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
    loanApplication,
    changedBy,
    fromStatus,
    toStatus,
    reason = "",
    metadata = {}
}) => {
    const auditLog = await AuditLog.create({
        loanApplication,
        changedBy,
        fromStatus,
        toStatus,
        reason,
        metadata
    });

    return auditLog;
};

module.exports = {
    createAuditLog
};