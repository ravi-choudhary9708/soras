# Soras MVP - AI Agent Instructions

## Project Overview
Soras MVP is a Next.js (App Router) based Restaurant Management System (POS). 
It features a role-based access control system (admin, manager, staff, chef), table management, menu item management, order processing (including half/full portions), and payment tracking. It uses MongoDB (Mongoose) for the database.

## Technology Stack
- **Framework:** Next.js (version 16.2.6) App Router
- **Database:** MongoDB with Mongoose (version 9.6.2)
- **Styling:** Tailwind CSS (via @tailwindcss/postcss v4)
- **Authentication:** Custom JWT-based auth and bcrypt for password hashing.
- **Icons:** lucide-react

## System Architecture
- `app/api/`: Contains Next.js API routes handling backend logic.
- `app/(admin|auth|chef|dashboard|scan)/`: Frontend route groups/pages for different user roles and flows.
- `models/`: Mongoose schemas defining the database structure (User, Restaurant, Order, OrderItem, MenuItem, Table, Payment, Customer).
- `utils/`: Helper functions like `apiError`.
- `scripts/`: Utility scripts like `seedAdmin.mjs`.

## AI Agent Guidelines
- **Framework Conventions:** Use Next.js App Router conventions (e.g., `page.js`, `layout.js`, `route.js`).
- **Database Interactions:** Use Mongoose models located in `/models`. Ensure proper indexing and relationships are maintained.
- **Authentication:** Respect the role-based system. Ensure API routes check for valid JWTs and correct roles (manager, staff, chef, admin).
- **Styling:** Use Tailwind CSS for all styling. Maintain a clean, modern aesthetic.
- **Error Handling:** Use the custom `apiError` utility in the backend to ensure consistent error responses.
