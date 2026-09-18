const EMI = require("../models/EMI");

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


const generateEMISchedule = async (loanApplication) => {
    const {
        amount,
        tenure
    } = loanApplication.loanDetails;

    const annualRate = loanApplication.interestRate;

    const emiAmount = calculateEMI(
        amount,
        annualRate,
        tenure
    );

    const monthlyRate = annualRate / 12 / 100;

    let remainingBalance = amount;

    const schedule = [];

    for (let i = 1; i <= tenure; i++) {

        const interestAmount =
            monthlyRate === 0
                ? 0
                : remainingBalance * monthlyRate;

        let principalAmount =
            emiAmount - interestAmount;

        let currentEmi = emiAmount;

        // Handle final installment rounding
        if (i === tenure) {
            principalAmount = remainingBalance;
            currentEmi = principalAmount + interestAmount;
        }

        remainingBalance =
            remainingBalance - principalAmount;

        if (remainingBalance < 0.01) {
            remainingBalance = 0;
        }

        const dueDate = new Date();

        dueDate.setMonth(
            dueDate.getMonth() + i
        );

        schedule.push({
            loanApplication: loanApplication._id,
            installmentNumber: i,
            dueDate,
            principalAmount: Number(principalAmount.toFixed(2)),
            interestAmount: Number(interestAmount.toFixed(2)),
            emiAmount: Number(currentEmi.toFixed(2)),
            remainingBalance: Number(
                remainingBalance.toFixed(2)
            ),
            status: "PENDING"
        });
    }

    await EMI.deleteMany({
        loanApplication: loanApplication._id
    });

    const createdSchedule = await EMI.insertMany(
        schedule
    );

    return createdSchedule;
};


module.exports = {
    calculateEMI,
    generateEMISchedule
};