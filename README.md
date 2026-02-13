# Smart Khata - Digital Account Management

A full-stack MERN application that helps shopkeepers and individuals manage their daily accounts digitally.

## Tech Stack

- **Frontend:** React.js + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Authentication:** JWT

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart-khata
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies API calls to the backend at `http://localhost:5000`.

## Features

- **User Authentication** - Register, Login, Logout with JWT
- **Customer Management** - Add, Edit, Delete customers with balance tracking
- **Transaction Management** - Record Money Given / Money Received per customer
- **Auto Balance Calculation** - Real-time balance computation
- **Dashboard** - Overview with total receivable, payable, net balance
- **Search & Filter** - Search customers by name, filter by balance status, date range
- **Reports** - Export PDF & CSV per customer, export all customers CSV
- **Mobile Responsive** - Clean UI that works on all devices

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get profile |
| GET | /api/customers | List customers |
| POST | /api/customers | Add customer |
| GET | /api/customers/:id | Get customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |
| GET | /api/customers/:id/transactions | Get transactions |
| POST | /api/customers/:id/transactions | Add transaction |
| DELETE | /api/transactions/:id | Delete transaction |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/dashboard/monthly | Monthly summary |
| GET | /api/reports/customer/:id/pdf | Download PDF |
| GET | /api/reports/customer/:id/csv | Download CSV |
| GET | /api/reports/all/csv | All customers CSV |
