const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
};

const checkEligibility = ({ loanApplication, documents }) => {
    const checks = [];

    // 1. Minimum age check
    const age = calculateAge(
        loanApplication.personalDetails.dateOfBirth
    );

    const minimumAgePassed = age >= 21;

    checks.push({
        rule: "MINIMUM_AGE",
        passed: minimumAgePassed,
        message: minimumAgePassed
            ? `Applicant is ${age} years old and meets the minimum age requirement`
            : `Applicant is ${age} years old and does not meet the minimum age requirement of 21`
    });

    // 2. Minimum income check
    const monthlyIncome =
        loanApplication.incomeDetails.monthlyIncome;

    const minimumIncomePassed = monthlyIncome >= 15000;

    checks.push({
        rule: "MINIMUM_INCOME",
        passed: minimumIncomePassed,
        message: minimumIncomePassed
            ? "Applicant meets the minimum monthly income requirement"
            : "Applicant does not meet the minimum monthly income requirement of ₹15,000"
    });

    // 3. Income-to-loan ratio check
    const loanAmount =
        loanApplication.loanDetails.amount;

    const maximumAllowedLoan = monthlyIncome * 60;

    const incomeToLoanRatioPassed =
        loanAmount <= maximumAllowedLoan;

    checks.push({
        rule: "INCOME_TO_LOAN_RATIO",
        passed: incomeToLoanRatioPassed,
        message: incomeToLoanRatioPassed
            ? "Requested loan amount is within the permitted income ratio"
            : `Requested loan amount exceeds the permitted limit of ₹${maximumAllowedLoan}`
    });

    // 4. Required documents check
    const hasIdProof = documents.some(
        (document) => document.documentType === "ID_PROOF"
    );

    const hasIncomeProof = documents.some(
        (document) => document.documentType === "INCOME_PROOF"
    );

    const requiredDocumentsPassed =
        hasIdProof && hasIncomeProof;

    checks.push({
        rule: "REQUIRED_DOCUMENTS",
        passed: requiredDocumentsPassed,
        message: requiredDocumentsPassed
            ? "Required ID and income documents are present"
            : "Required ID proof and income proof are missing"
    });

    // Applicant is eligible only when every check passes
    const eligible = checks.every(
        (check) => check.passed
    );

    return {
        checked: true,
        eligible,
        checks,
        checkedAt: new Date()
    };
};

module.exports = {
    checkEligibility
};