# Soras MVP - Restaurant Management System

A comprehensive Point of Sale (POS) and Restaurant Management System built with Next.js and MongoDB.

## Features
- **Role-Based Access Control:** Distinct interfaces and permissions for Admins, Managers, Staff, and Chefs.
- **Order Management:** Create and track orders, support for full/half portions, and status updates (preparing, ready, served).
- **Table Management:** Manage restaurant tables, generate QR codes for tables.
- **Menu Management:** Add and update menu items.
- **Billing & Payments:** Track open, billed, and paid orders with cash/UPI modes.
- **QR Code Ordering:** Support for scanning QR codes to place orders.

## Tech Stack
- **Frontend & Backend:** Next.js (App Router)
- **Database:** MongoDB (Mongoose)
- **Styling:** Tailwind CSS
- **Authentication:** Custom JWT (JSON Web Tokens) & bcrypt
- **Images:** Cloudinary
- **Icons:** Lucide React

## Getting Started

First, install the dependencies:
```bash
npm install
```

Set up your environment variables by checking the `.env.local` file configuration (ensure it has MongoDB URI and JWT secrets).

Seed the initial admin user:
```bash
npm run db:seed-admin
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Directory Structure
- `app/`: Next.js frontend pages and backend API routes (`app/api/`).
- `models/`: Mongoose schemas for the database.
- `utils/`: Helper functions.
- `scripts/`: Utility scripts like DB seeding.
