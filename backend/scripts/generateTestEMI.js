const dotenv = require("dotenv");
const connectDB = require("../src/config/db");

const LoanApplication = require("../src/models/LoanApplication");
const { generateEMISchedule } = require("../src/services/emiService");

dotenv.config();

const generateTestEMI = async () => {
    try {
        await connectDB();

        const loanApplication = await LoanApplication.findById(
            "6aad2edbe621ca898827cadf"
        );

        if (!loanApplication) {
            console.log("Loan application not found");
            process.exit(1);
        }

        if (loanApplication.status !== "APPROVED") {
            console.log("Loan is not approved");
            process.exit(1);
        }

        const schedule = await generateEMISchedule(
            loanApplication
        );

        console.log(
            `EMI schedule generated successfully: ${schedule.length} installments`
        );

        process.exit(0);

    } catch (error) {
        console.error("Error generating EMI schedule:", error);
        process.exit(1);
    }
};

generateTestEMI();
