const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const loanRoutes = require("./routes/loanRoutes");
const documentRoutes = require("./routes/documentRoutes");
const officerRoutes = require("./routes/officerRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/loans", loanRoutes);
app.use("/api/v1/loans", documentRoutes);
app.use("/api/v1/officer", officerRoutes);


// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Loan Management System API is running"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();