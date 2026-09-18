const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("../src/models/User");

dotenv.config();

const users = [
    {
        name: "Test Loan Officer",
        email: "officer@test.com",
        password: "password123",
        role: "LOAN_OFFICER"
    },
    {
        name: "Test Admin",
        email: "admin@test.com",
        password: "password123",
        role: "ADMIN"
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        for (const userData of users) {
            const existingUser = await User.findOne({
                email: userData.email
            });

            if (existingUser) {
                console.log(
                    `${userData.email} already exists`
                );
                continue;
            }

            const hashedPassword = await bcrypt.hash(
                userData.password,
                12
            );

            await User.create({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role
            });

            console.log(
                `${userData.role} created: ${userData.email}`
            );
        }

        console.log("User seeding completed");
        process.exit(0);

    } catch (error) {
        console.error(
            "User seeding failed:",
            error.message
        );

        process.exit(1);
    }
};

seedUsers();