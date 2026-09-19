# 🏦 Loan Management System

A full-stack Loan Management System built to manage the complete loan application lifecycle — from applicant registration and loan application to document submission, eligibility verification, officer review, admin approval/rejection, audit tracking, and EMI schedule generation.

The application implements role-based access control for **Applicants, Loan Officers, and Administrators**, with a React frontend, Node.js/Express REST API, and MongoDB database.

---

## 🌐 Live Application

### Frontend
https://loan-management-system-jet.vercel.app/login

### Backend API
https://loan-management-system-backend-7nph.onrender.com/

### GitHub Repository
https://github.com/Nikhil-Kumar-Dwivedi/loan-management-system



## 📌 Overview

The Loan Management System provides a structured workflow for processing loan applications.

An applicant can:

- Create an account
- Log in securely
- Create and save loan applications as drafts
- Resume incomplete applications
- Enter personal, loan, and income information
- Upload identity and income documents
- Preview estimated EMI
- Submit a loan application
- Track application status
- View the to additional-information requests
- View officer recommendations
- View the final admin decision
- View the repayment/EMI schedule for approved loans

Loan Officers can:

- View the loan review queue
- Filter applications
- Open complete application details
- Review submitted documents
- Run deterministic eligibility checks
- Record approval/rejection recommendations
- Request additional information


Administrators can:

- View all loan applications
- Review officer recommendations
- Approve or reject applications
- Add final remarks
- View users
- Create users
- Change user roles
- Activate/deactivate users
- View complete application information


The system also maintains an audit trail for important loan status transitions.

---

# ✨ Key Features

## 🔐 Authentication & Authorization

- User registration and login
- Password hashing using `bcryptjs`
- JWT-based authentication
- Access token and refresh token flow
- Refresh token rotation
- Protected API routes
- Role-based authorization
- Frontend protected routes
- Admin-only user management
- Applicant signup always creates an `APPLICANT` account

### Supported Roles

| Role | Description |
|---|---|
| `APPLICANT` | Applies for loans and tracks applications |
| `LOAN_OFFICER` | Reviews applications and makes recommendations |
| `ADMIN` | Performs final decisions and manages users |

---

# 👤 Applicant Features

## Multi-Step Loan Application

Applicants can create applications through a structured multi-step form containing:

### Step 1 — Personal Details

- Full name
- Date of birth
- PAN number
- Address

### Step 2 — Loan Details

- Loan type
- Loan amount
- Tenure
- Purpose

### Supported Loan Types

- Personal Loan
- Home Loan
- Vehicle Loan
- Business Loan

### Step 3 — Income Details

- Monthly income
- Employment type

### Step 4 — Documents

Supported document formats:

- PDF
- JPG
- JPEG
- PNG

Maximum file size:

```text
5 MB

Applicants can review their information before submitting the application.


💾 Draft & Resume

Loan applications can be saved as drafts.

Applicants can:

Start an application
Save incomplete information
Leave the application
Return later
Resume the draft
Complete and submit it


💰 Interest Rates

The system uses fixed sample interest rates based on the selected loan type.

Loan Type	   Annual Interest Rate
Personal	    12%
Home	        8.5%
Vehicle	        9.5%
Business	    11%

The applicable rate is stored with the loan application.

🧮 EMI Calculation

The system calculates the estimated EMI using the standard reducing-balance EMI formula:
EMI = P × r × (1 + r)^n
     ----------------------
        (1 + r)^n - 1

Where
P = Principal loan amount
r = Monthly interest rate
n = Number of monthly installments

The calculated EMI is displayed during the application process.

For approved applications, the backend generates a detailed repayment schedule containing:

->Installment number
->Due date
->EMI amount
->Principal component
->Interest component
->Remaining balance



📄 Document Management

Applicants can upload supporting documents for their applications.

Documents are:

Associated with the specific loan application
Stored with metadata
Accessible only through authorized routes
Viewable by the applicant, assigned review roles, and administrators according to authorization rules


🔎 Eligibility Engine

Loan Officers can run a deterministic eligibility check.

The current eligibility rules include:

Minimum Age
Age >= 21 years
Minimum Monthly Income
Monthly income >= ₹15,000
Loan-to-Income Limit
Loan amount <= 60 × monthly income
Required Documents

The applicant must provide:

Identity proof
Income proof

The eligibility engine returns individual rule results showing whether each condition passed or failed.

Example:

Age Check             ✓ PASS
Monthly Income Check  ✓ PASS
Loan-to-Income Check  ✓ PASS
Identity Proof        ✓ PASS
Income Proof          ✓ PASS

The eligibility result is stored with the loan application.

🔄 Loan Application Lifecycle

The application uses the following status flow:

DRAFT
  │
  ▼
SUBMITTED
  │
  ▼
UNDER_REVIEW
  │
  ├───────────────┐
  │               │
  ▼               ▼
MORE_INFO_NEEDED  Officer Review
  │               │
  │               ├── APPROVAL
  │               │       │
  │               │       ▼
  │               │ OFFICER_RECOMMENDED_APPROVAL
  │               │       │
  │               │       ▼
  │               │   ADMIN DECISION
  │               │       │
  │               │   ┌───┴────┐
  │               │   ▼        ▼
  │               │ APPROVED  REJECTED
  │               │
  │               └── REJECTION
  │                       │
  │                       ▼
  │               OFFICER_RECOMMENDED_REJECTION
  │
  ▼
Applicant responds
  │
  ▼
SUBMITTED


👨‍💼 Loan Officer Workflow

Loan Officers have a dedicated review queue.

They can:

View submitted applications
Filter by status
Filter by loan type
Filter by date range
View applicant information
View loan information
View income information
Review uploaded documents
Run eligibility checks
Add review notes
Officer Recommendations

A Loan Officer can choose:

APPROVAL
REJECTION
MORE_INFO
Approval
UNDER_REVIEW
      ↓
OFFICER_RECOMMENDED_APPROVAL

The application then waits for the Administrator's final decision.

Rejection Recommendation
UNDER_REVIEW
      ↓
OFFICER_RECOMMENDED_REJECTION

The final decision is still controlled by the Administrator.

More Information
UNDER_REVIEW
      ↓
MORE_INFO_NEEDED


👑 Administrator Workflow

Administrators have complete visibility over the system.

User Management

Administrators can:

View users
Create users
Change user roles
Activate users
Deactivate users
Final Loan Decision

Administrators can review:

Applicant details
Loan details
Income details
Eligibility results
Documents
Officer recommendation
Officer notes
Audit history

The Administrator can then make the final decision:

APPROVED

or

REJECTED


📊 Audit Trail

Important loan status changes are recorded in an audit log.

Each audit record stores information such as:

Loan application
User who performed the action
Previous status
New status
Reason
Timestamp
Additional metadata when applicable


💳 EMI Repayment Schedule

When an Administrator approves a loan, the system automatically generates the EMI repayment schedule.

Each installment contains:

Installment number
Due date
EMI amount
Principal amount
Interest amount
Remaining balance

------- screnshot


🛠️ Technology Stack

Frontend

Technology	Purpose
React	UI development
Vite	Frontend build tool
React Router	Client-side routing
Axios	HTTP/API communication
JavaScript	Application logic
CSS	Responsive UI and styling


Backend

Technology	Purpose
Node.js	Runtime
Express.js	REST API
Mongoose	MongoDB ODM
JWT	Authentication
bcryptjs	Password hashing
Multer	File uploads
CORS	Cross-origin API access
Helmet	HTTP security headers
express-rate-limit	Rate limiting
cookie-parser	Cookie parsing
dotenv	Environment configuration

Database
MongoDB Atlas
        +
Mongoose


Deployment
Component	     Platform
Frontend	     Vercel
Backend	         Render
Database	     MongoDB Atlas
Source Control	 GitHub



🔌 REST API
| Method | Endpoint        | Access        | Description           |
| ------ | --------------- | ------------- | --------------------- |
| POST   | `/auth/signup`  | Public        | Register an applicant |
| POST   | `/auth/login`   | Public        | Login                 |
| POST   | `/auth/refresh` | Public        | Refresh access token  |
| POST   | `/auth/logout`  | Authenticated | Logout                |
| GET    | `/auth/me`      | Authenticated | Get current user      |


Applicant Loan APIs
| Method | Endpoint             | Access          | Description                  |
| ------ | -------------------- | --------------- | ---------------------------- |
| POST   | `/loans`             | Applicant       | Create loan/draft            |
| GET    | `/loans/my`          | Applicant       | Get applicant's applications |
| GET    | `/loans/:id`         | Authorized user | Get loan details             |
| PATCH  | `/loans/:id`         | Applicant       | Update draft                 |
| POST   | `/loans/:id/submit`  | Applicant       | Submit application           |
| POST   | `/loans/:id/respond` | Applicant       | Respond to more-info request |
| GET    | `/loans/:id/emi`     | Applicant       | Get EMI schedule             |
| GET    | `/loans/:id/audit`   | Authorized user | Get audit history            |


Document APIs
| Method | Endpoint                            | Access     | Description               |
| ------ | ----------------------------------- | ---------- | ------------------------- |
| POST   | `/loans/:id/documents`              | Applicant  | Upload document           |
| GET    | `/loans/:id/documents`              | Authorized | Get application documents |
| GET    | `/loans/documents/:documentId/view` | Authorized | View document             |


Loan Officer APIs
| Method | Endpoint                         | Access       | Description             |
| ------ | -------------------------------- | ------------ | ----------------------- |
| GET    | `/officer/loans`                 | Loan Officer | Get review queue        |
| GET    | `/officer/loans/:id`             | Loan Officer | Get application details |
| POST   | `/officer/loans/:id/eligibility` | Loan Officer | Run eligibility check   |
| POST   | `/officer/loans/:id/review`      | Loan Officer | Submit recommendation   |


Officer recommendations:
APPROVAL
REJECTION
MORE_INFO


Administrator APIs
| Method | Endpoint                    | Access | Description          |
| ------ | --------------------------- | ------ | -------------------- |
| GET    | `/admin/users`              | Admin  | Get users            |
| POST   | `/admin/users`              | Admin  | Create user          |
| PATCH  | `/admin/users/:id`          | Admin  | Update user          |
| GET    | `/admin/loans`              | Admin  | Get all loans        |
| GET    | `/admin/loans/:id`          | Admin  | Get loan details     |
| POST   | `/admin/loans/:id/decision` | Admin  | Final approve/reject |


🔐 Environment Variables
Create
backend/.env

with
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_token_secret

JWT_REFRESH_SECRET=your_refresh_token_secret


Frontend

Create:
frontend/.env



🚀 Local Development
Prerequisites

Install:

Node.js
npm
MongoDB Atlas account or local MongoDB
Git


1. Clone the Repository
git clone https://github.com/Nikhil-Kumar-Dwivedi/loan-management-system.git
cd loan-management-system

2. Backend Setup
cd backend
npm install

Create:

backend/.env

Add:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

Start the backend:

npm start

For development, if the project provides the development script:

npm run dev

The backend will run locally on:

http://localhost:5000

Health check:

http://localhost:5000/

Expected response:

{
  "message": "Loan Management System API is running"
}



3. Frontend Setup

Open another terminal:

cd frontend
npm install

Create:

frontend/.env

Add:

VITE_API_URL=http://localhost:5000/api/v1

Start the development server:

npm run dev

Vite will provide the local frontend URL in the terminal, typically:

http://localhost:5173


🧪 Application Testing Flow

A complete manual test can be performed using the following workflow.

Applicant
Register/login
Open applicant dashboard
Create a loan application
Save it as a draft
Resume the draft
Enter personal information
Enter loan information
Enter income information
Upload required documents
Review the application
Submit the application
Verify status becomes SUBMITTED
Loan Officer
Login as Loan Officer
Open review queue
Find the submitted application
Open application details
Run eligibility check
Verify eligibility rules
Review documents
Add review note
Choose:
Approval
Rejection
More Information
Administrator
Login as Administrator
Open all applications
Open the reviewed application
Verify officer recommendation
Review officer remarks
Approve or reject the application
Add final remarks
Approved Loan

For an approved application:

Verify status becomes APPROVED
Verify EMI schedule is generated
Open the EMI schedule
Verify principal, interest, EMI, and remaining balance
Audit Trail

Verify that the application history records important transitions such as:

DRAFT → SUBMITTED
SUBMITTED → UNDER_REVIEW
UNDER_REVIEW → OFFICER_RECOMMENDED_APPROVAL
OFFICER_RECOMMENDED_APPROVAL → APPROVED


🗄️ Database Models

The backend uses the following primary MongoDB/Mongoose models.

User

Stores:

Name
Email
Password hash
Role
Account status
Refresh token information
LoanApplication

Stores:

Applicant
Personal details
Loan details
Income details
Status
Interest rate
Estimated EMI
Eligibility result
Officer review
Admin review
Additional information requests
Submission timestamp
Document

Stores:

Loan application
Document type
Original filename
Stored filename/path
MIME type
File metadata
AuditLog

Stores:

Loan application
User performing the action
Previous status
New status
Reason
Timestamp
Metadata
EMI

Stores:

Loan application
Installment number
Due date
EMI
Principal
Interest
Remaining balance
🔒 Security

The application implements several security mechanisms:

Password hashing using bcrypt
JWT authentication
Access and refresh tokens
Role-based API authorization
Protected frontend routes
Admin-only management routes
File upload restrictions
File size restrictions
CORS
Helmet security middleware
API rate limiting
Environment variables for secrets
.env excluded from Git
Server-side eligibility validation


🌍 Deployment Architecture

The production architecture is:

                    ┌──────────────────────┐
                    │       GitHub         │
                    │    Source Code       │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐       ┌─────────────────┐
        │     Vercel      │       │     Render      │
        │ React + Vite    │──────▶│ Node + Express  │
        │   Frontend      │ API   │    Backend      │
        └─────────────────┘       └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │  MongoDB Atlas  │
                                  │    Database     │
                                  └─────────────────┘


📦 Deployment Configuration
Backend — Render

The backend is deployed as a Render Web Service.

Root Directory:
backend

Build Command:
npm install

Start Command:
npm start


Frontend — Vercel

The frontend is deployed from the frontend directory.

Root Directory:
frontend

Framework:
Vite

Build Command:
npm run build

Output Directory:
dist



