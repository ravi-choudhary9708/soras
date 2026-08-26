# Soras MVP - Comprehensive System Documentation

## 1. Introduction
Soras MVP is a unified, multi-tenant Restaurant Management System designed to streamline operations from digital order taking, table management, to kitchen coordination and final billing. Built on Next.js 16 (App Router) and MongoDB, it caters to roles ranging from platform Super Admins to Restaurant Managers, Staff, Chefs, and end Customers.

## 2. Architecture Overview
The application is a monolithic Next.js (App Router) application.
- **Frontend Layer:** Built using React Server Components (RSC) and Client Components with Tailwind CSS for styling. Different route groups (e.g., `(admin)`, `(auth)`) separate concerns per role.
- **Backend API Layer:** Utilizes Next.js API Routes (`app/api/`) acting as a RESTful backend. 
- **Database Layer:** MongoDB, accessed via Mongoose ODM.
- **External Services:**
  - **Cloudinary:** Used for storing images (Menu items, Payment screenshots, QR Codes).
  - **JSON Web Tokens (JWT):** Used for stateless authentication.

### 2.1 Directory Structure
- `/app/(auth)`: Registration and Login screens for users.
- `/app/admin`: Super admin dashboards (platform level).
- `/app/dashboard`: Manager dashboards (managing menus, tables, generating QRs, viewing daily summaries).
- `/app/chef`: Kitchen display system; chefs view orders and update statuses (`preparing` -> `ready`).
- `/app/scan`: Customer-facing QR code scanning interfaces for viewing the menu and placing orders via session tokens.
- `/app/api/`: All backend endpoints.
  - `/api/auth`: Login, Logout, Refresh Tokens.
  - `/api/manager`: Manager-specific routes (e.g., table management).
  - `/api/staff`: Staff-specific routes (e.g., order creation).
  - `/api/res/menu` & `/api/res/order`: Restaurant-specific menu and order handling.
  - `/api/customer`: Customer profiles and history.
  - `/api/payment`: Payment screenshot uploads and verification.
- `/models/`: Contains all Mongoose schemas.
- `/utils/`: Shared utilities like `apiError` for consistent HTTP error handling.
- `/scripts/`: One-off tasks (e.g., `seedAdmin.mjs`).

---

## 3. Database Schema Detailed (Mongoose Models)

### 3.1 User
Handles authentication and RBAC (Role-Based Access Control) for internal staff.
- **Fields:** `restaurantId` (null for super admin), `username`, `email`, `phone`, `fullName`, `password` (bcrypt hashed), `role` (`manager`, `staff`, `chef`, `admin`), `refreshToken`.
- **Methods:** `generateAccessToken(1d)`, `generateRefereshToken(10d)`, `isPasswordCorrect`.

### 3.2 Customer
End-users ordering food.
- **Fields:** `name`, `phone` (unique), `email`, `password`, `role` (default: "customer"), `visitedRestaurants` (Ref[]), `orderHistory` (Ref[]), `whatsappOptIn` (Boolean).
- **Methods:** `generateAccessToken`, `generateRefreshToken`.

### 3.3 Restaurant
Stores multi-tenant data for individual restaurant clients.
- **Fields:** `name`, `phone`, `upiId` (for payments), `plan` (`trial`, `monthly`), `isAccountActive`, `graceExpiresAt`, `planExpiresAt`.

### 3.4 Table
Physical tables inside a restaurant. 
- **Fields:** `restaurantId`, `tableNumber`, `room`, `masterQrCode`, `qrCodeUrl` (Cloudinary), `qrPublicId`, `sessionToken`, `sessionExpiresAt`, `status` (`free`, `occupied`).
- **Concept:** Tables can have a session token active, meaning a customer has scanned the QR code and holds a session to place orders.

### 3.5 MenuItem
The catalogue of products.
- **Fields:** `restaurantId`, `name`, `description`, `image`, `price`, `category`, `isVeg`, `isAvailable`, `isHalfAllowed`.

### 3.6 Order & OrderItem
Tracks customer orders at a table.
- **Order Fields:** `restaurantId`, `tableId`, `tableNumber`, `sessionToken`, `customerId`, `isVerifiedBy` (Staff User), `items` (Array of OrderItems), `PaymentStatus` (`open`, `billed`, `paid`), `isVerified` (Boolean), `paymentMode` (`cash`, `upi`), `totalAmount`, `orderStatus` (`pending`, `preparing`, `ready`, `served`, `cancelled`, `completed`).
- **OrderItem Fields:** `menuItemId`, `name`, `price`, `quantity`, `portion` (`full`, `half`), `kotPrintd` (Boolean).
- **Logic:** `Order` contains a `pre('validate')` hook that calculates the total amount dynamically, correctly pricing half-portions (half price, rounded up).

### 3.7 Payment
Tracks platform subscriptions or restaurant invoice payments to Soras (SuperAdmin).
- **Fields:** `restaurantId`, `managerId`, `screenshotUrl`, `cloudinaryPublicId`, `billingCycle`, `note`, `status` (`pending`, `approved`, `rejected`), `verifiedAt`, `rejectionReason`.

### 3.8 DailySummary
Aggregated daily metrics for a restaurant.
- **Fields:** `restaurantId`, `date`, `totalCash`, `totalUpi`, `totalOrder`, `topItems` (embedded array tracking best-selling dishes with `totalQuantitySold` and `totalRevenueGenerated`).

---

## 4. Key Workflows & Features

### 4.1 Authentication & Authorization Flow
1. User logs in.
2. The server compares the password via `bcrypt`.
3. If valid, an Access Token and Refresh Token (JWT) are generated. The payload includes `_id`, `email`, `role`, and `restaurantId`.
4. API routes and frontend pages verify the JWT. Based on the `role`, the system either grants or denies access to specific areas (e.g., only `manager` can modify tables).

### 4.2 Customer QR Code Ordering Flow
1. A Manager generates a Table in the system. The system creates a QR code (uploaded to Cloudinary) and associates it with the Table.
2. A customer sits at the table and scans the QR code.
3. Scanning opens `/app/scan/` endpoints, generating a temporary `sessionToken` on the `Table`.
4. The customer browses the menu (`MenuItem`) and places an `Order`.
5. The `Order` is saved with `orderStatus: 'pending'` and `PaymentStatus: 'open'`.

### 4.3 Kitchen & Fulfillment Flow
1. The Chef watches the `/app/chef` dashboard.
2. The `pending` order appears. The Chef clicks to update it to `preparing`, and later to `ready`.
3. Waitstaff (Staff role) sees the `ready` order on their device (`/app/dashboard` or `/app/staff`), serves it to the table, and updates it to `served`.

### 4.4 Billing & Summary Flow
1. After dining, the order goes to billing. The system calculates the `totalAmount`.
2. The payment is received (`cash` or `upi`), and `PaymentStatus` is marked `paid`.
3. At the end of the day, a cron job or manual trigger generates a `DailySummary`, counting total cash, UPI, orders, and aggregating the `topItems` based on the day's completed orders.

### 4.5 Subscription Management (Payments)
1. Managers of a Restaurant must pay for their subscription (`plan` = `monthly`).
2. They upload a screenshot of their UPI transfer. This creates a `Payment` record with status `pending` and uploads the image to Cloudinary.
3. The Super Admin reviews the `Payment` and approves it, extending the `planExpiresAt` on the `Restaurant` model.
