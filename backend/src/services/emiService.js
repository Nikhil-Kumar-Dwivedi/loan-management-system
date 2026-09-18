const calculateEMI = (principal, annualRate, tenureMonths) => {
    const monthlyRate = annualRate / 12 / 100;

    // If interest rate is 0
    if (monthlyRate === 0) {
        return Number((principal / tenureMonths).toFixed(2));
    }

    const emi =
        (principal *
            monthlyRate *
            Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return Number(emi.toFixed(2));
};

module.exports = {
    calculateEMI,
};