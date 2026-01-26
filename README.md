# Rekova

## Overview
**Rekova** is a loan collection management system designed to help financial institutions manage customer loans, track repayments, and streamline collection processes.

## Core Features
| Feature | Description |
| :--- | :--- |
| **Customer Management** | Track borrower information, loan balances, arrears, and contact details |
| **M-Pesa Integration** | Process payments via STK Push with simulation capabilities |
| **Payment Tracking** | Monitor transaction status, receipts, and financial updates |
| **Agent Workflow** | Role-based dashboards for agents, supervisors, and admins |
| **Communication Logs** | Record follow-ups, payment promises, and customer interactions |
| **Reporting & Exports** | Generate customer statements and CSV exports |

## System Architecture
### Backend (Collects)
- **Framework**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based access control
- **Payment Gateway**: M-Pesa STK Push simulation

### Frontend (CollectFront)  
- **Framework**: React.js with Vite
- **UI Components**: Custom dashboard, sidebar navigation, form controls
- **State Management**: React hooks + Context API

## Project Structure
```
Collects/ (Backend)
├── models/              # MongoDB schemas
│   ├── Customer.js      # Borrower information
│   ├── Transaction.js   # Payment records
│   ├── Comment.js       # Customer interactions
│   ├── User.js         # System users
│   └── Loan.js         # Loan agreements
├── controllers/         # Business logic
│   ├── authController.js
│   ├── customerController.js
│   └── paymentController.js
├── routes/             # API endpoints
│   ├── authRoutes.js
│   ├── customerRoutes.js
│   └── paymentRoutes.js
├── middleware/         # Auth & validation
├── config/            # Database configuration
└── server.js          # Application entry point

CollectFront/ (Frontend)
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── auth/      # Login forms
│   │   └── layout/    # Sidebar, headers
│   ├── pages/         # Main application pages
│   │   ├── Dashboard.jsx
│   │   ├── LoginPage.jsx
│   │   ├── customerPage.jsx
│   │   └── PaymentPage.jsx
│   ├── App.jsx        # Root component
│   └── main.jsx       # Application entry
└── package.json       # Dependencies
```

## User Roles & Permissions
| Role | Permissions |
| :--- | :--- |
| **Admin** | Full system access, user management, configuration |
| **Supervisor** | View all agents, approve actions, generate reports |
| **Agent** | Manage assigned customers, record payments, add comments |


### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- M-Pesa Daraja API credentials (for production)


### Default Access
- **Backend API**: `http://localhost:5000`
- **Frontend**: `http://localhost:5173`
- **API Documentation**: `http://localhost:5000/api-docs` (when implemented)

## Key API Endpoints

| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | User authentication | Public |
| `/api/auth/me` | GET | Get current user | All roles |
| `/api/customers` | GET | List customers | All roles |
| `/api/customers/export` | GET | Export to CSV | Admin/Supervisor |
| `/api/payments/initiate` | POST | Start M-Pesa payment | All roles |
| `/api/transactions` | GET | View transactions | All roles |
| `/api/customers/{id}/comments` | POST | Add customer comment | All roles |

## M-Pesa Integration
The system supports both:
- **Simulation Mode**: For development and testing
- **Live Mode**: Production integration with Safaricom Daraja API

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/collects
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=5000

# M-Pesa Credentials (for production)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```


**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: Samuel Kirogo