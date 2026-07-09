# 🍽️ SORAS Backend Review

## Overview

Your backend is a **Next.js App Router API** (Next.js 16) with **Mongoose/MongoDB**, **JWT auth**, **Cloudinary** for image uploads, and a **QR-session** flow for dine-in ordering. The overall architecture is solid and well-thought-out for an MVP. Below is a detailed breakdown of what's great, what's broken, and what needs attention.

---

## ✅ What's Working Well

| Area | Verdict |
|---|---|
| Architecture | Multi-tenant by `restaurantId` on every model — great design |
| Auth flow | `withAuth` HOC pattern wrapping route handlers is clean |
| DB connection | Proper singleton-cached Mongoose connection for Next.js serverless |
| Password security | bcrypt with salt rounds = 10 ✅ |
| Token storage | `httpOnly` cookies for JWT — correct security choice |
| Cloudinary upload | Browser-side signed upload avoids routing binary through your server — smart |
| QR session | Atomic `findOneAndUpdate` race-condition protection on table claiming is solid |
| Order pre-save hook | Auto-calculates `totalAmount` from menu item prices — good |
| Daily summary model | `TopItemSchema` with `_id: false` to reduce index overhead — good detail |
| Billing sweep (cron.js) | Multi-stage account lifecycle management is well structured |

---

## 🔴 Critical Bugs (Will Break in Production)

### 1. `index.js` — Wrong File Content
**File**: [index.js](file:///c:/Users/Admin/Desktop/soras_mvp/index.js)

`index.js` contains a **React component** (`PaymentForm`) — not a server entry point. This file appears to be misnamed or misplaced. It has no effect in Next.js App Router but is confusing.

---

### 2. `order.model.js` — `OrderItem` is Not Imported
**File**: [order.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/order.model.js) — Line 31

```js
// ❌ OrderItem is used but never imported
items: { type: [OrderItem], ... }
```

`OrderItem` is used in the schema but never imported. This will crash the server at startup.

**Fix**: Add at the top:
```js
import { OrderItem } from "./orderItem.model";
```

---

### 3. `order.model.js` — `orderStatus` field is missing `type: String`
**File**: [order.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/order.model.js) — Line 64

```js
// ❌ Missing `type: String`
orderStatus:{
    enum:[...],
    default:"pending",
    index:true
}
```

Mongoose requires `type` to be declared. Without it the field will silently be treated as a Mixed type.

**Fix**:
```js
orderStatus:{
    type: String,
    enum:["preparing","ready","served","completed","pending","cancelled"],
    default:"pending",
    index:true
}
```

---

### 4. `orderItem.model.js` — Model Cache Name Collision 🔥
**File**: [orderItem.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/orderItem.model.js) — Line 35

```js
// ❌ Uses "Order" model cache key instead of "OrderItem"
export const OrderItem = mongoose.models.Order || mongoose.model("OrderItem", orderItemSchema);
```

This will either return the `Order` model from the cache instead of `OrderItem`, or cause a model registration conflict. **Extremely likely to cause silent data corruption.**

**Fix**:
```js
export const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);
```

---

### 5. `payment.model.js` — `mongoosePaginate` is Not Imported
**File**: [payment.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/payment.model.js) — Line 46

```js
// ❌ mongoosePaginate is not imported or installed
paymentSchema.plugin(mongoosePaginate);
```

This will crash at model import time. Remove this line or install and import `mongoose-paginate-v2`.

---

### 6. `placeOrder/route.js` — Duplicate Key Overwrites Itself
**File**: [placeOrder/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/res/order/placeOrder/route.js) — Lines 72–73

```js
// ❌ isVerifiedBy is defined twice; second one overwrites first with boolean
isVerifiedBy: isStaffUser ? authenticatedUserId : null,
isVerifiedBy: isStaffUser,  // ← This silently wins
```

The second `isVerifiedBy` (a boolean) overwrites the first (the staff ObjectId). You lose the reference to who verified it.

**Fix**: Remove the duplicate line. The first one is correct:
```js
isVerifiedBy: isStaffUser ? authenticatedUserId : null,
```

---

### 7. `generateQr/route.js` — `await` Missing on `req.json()`
**File**: [generateQr/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/manager/table/generateQr/route.js) — Line 16

```js
// ❌ Missing await — returns a Promise, not the data
const {tableNumber, room} = req.json();
```

**Fix**:
```js
const {tableNumber, room} = await req.json();
```

---

### 8. `generateQr/route.js` — `crypto.randomBytes` is from Node.js, not `crypto-js`
**File**: [generateQr/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/manager/table/generateQr/route.js) — Line 22

```js
// ❌ crypto-js does not have .randomBytes()
import crypto from "crypto-js";
const randomSalt = crypto.randomBytes(4).toString("hex"); 
```

`crypto-js` is a pure JS library that does NOT expose `.randomBytes()`. Use Node's native crypto:

**Fix**:
```js
import crypto from "crypto"; // Node.js built-in
const randomSalt = crypto.randomBytes(4).toString("hex");
```

Also — `generateQr/route.js` never exports a handler (`export const POST = ...`). The handler function is defined but not exported.

---

### 9. `res/order/payment/route.js` — Multiple Runtime Crashes
**File**: [payment/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/res/order/payment/route.js)

```js
// ❌ Missing await on req.json()
const {orderId, tableId, paymentMode} = req.json();

// ❌ "paid" is not quoted — ReferenceError
PaymentStatus: paid,  // should be "paid"

// ❌ Importing lucide-react icon in a route handler — wrong file
import { NewspaperIcon } from "lucide-react";
```

---

### 10. `getPendingOrder/route.js` — Missing `await` on `req.json()`
**File**: [getPendingOrder/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/res/order/getPendingOrder/route.js) — Line 12

```js
// ❌ Missing await
const {restaurantId} = req.json();
```

**Fix**: 
```js
const {restaurantId} = await req.json();
```

> **Note**: `restaurantId` is already available on `req.user.restaurantId` (the user is authenticated via `withAuth`). You don't need it in the body at all — just use `req.user.restaurantId`.

---

### 11. `verifyOrder/route.js` — Wrong Field Name
**File**: [verify/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/res/order/verify/%5BorderId%5D/route.js) — Line 28

```js
// ❌ Sets "status" instead of "orderStatus"
$set: { isVerified: true, isVerifiedBy: staffId, status: "preparing" }
```

The Order model has `orderStatus`, not `status`. This update will silently do nothing for the status transition.

**Fix**:
```js
$set: { isVerified: true, isVerifiedBy: staffId, orderStatus: "preparing" }
```

---

### 12. `makeOrderReady/route.js` — Typo in Query Filter
**File**: [makeOrderReady/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/res/order/makeOrderReady/%5BorderId%5D/route.js) — Line 20

```js
// ❌ "preparng" — typo, will never match "preparing"
{_id: orderId, restaurantId, orderStatus: "preparng"}
```

**Fix**:
```js
{_id: orderId, restaurantId, orderStatus: "preparing"}
```

---

### 13. `verifyPayment/route.js` — `Restaurant` Not Imported
**File**: [verifyPayment/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/payment/verifyPayment/route.js) — Lines 41, 47

```js
// ❌ Restaurant is used but never imported
const restaurant = await Restaurant.findByIdAndUpdate(...)
```

Also, the variable `restaurant` on line 52 is only defined inside the `if (status === "rejected")` block but referenced at line 52 outside of it — will throw `ReferenceError`.

---

### 14. `res/menu/add/route.js` — Multiple Broken Imports
**File**: [add/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/res/menu/add/route.js)

```js
// ❌ Wrong path: "@/lib/dbConnect" should be "@/libs/dbConnect"
import dbConnect from "@/lib/dbConnect";

// ❌ Default import on named export
import MenuItem from "@/models/menuItem.model"; // should be { MenuItem }
import apiError from "@/utils/apiError";        // should be { apiError }

// ❌ apiresponse (lowercase r) — undefined variable
return NextResponse.json(new apiresponse(201,...));

// ❌ withAuth is used but never imported
export const POST = withAuth(addMenuItem, ["manager"]);
```

---

### 15. `storefront/scan/route.js` — Default Imports on Named Exports
**File**: [scan/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/storefront/scan/%5BmasterQrCode%5D/route.js) — Lines 4–5

```js
// ❌ Both use default imports but models export named exports
import Table from "@/models/table.model";
import MenuItem from "@/models/menuItem.model";
```

**Fix**:
```js
import { Table } from "@/models/table.model";
import { MenuItem } from "@/models/menuItem.model";
```

---

### 16. `storefront/order/create/route.js` — `const` Assignment to Block-Scoped Variable
**File**: [create/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/storefront/order/create/route.js) — Lines 24, 27

```js
// ❌ declared as const but then reassigned
const activeSessionToken = table.sessionToken;
// ...
activeSessionToken = crypto.randomBytes(8).toString("hex"); // TypeError!
```

Also `crypto` here refers to Web Crypto API in Edge, but `crypto.randomBytes` is Node-only. `apiResponse` and `apiError` are also not imported.

**Fix**: Use `let` for `activeSessionToken` and `crypto.randomUUID()` instead.

---

## 🟡 Security Issues

| Issue | Location | Severity |
|---|---|---|
| `withAuth` checks `allowedRoles` with `!allowedRoles.includes(user.role)` but `registerStaff` passes the string `"manager"` instead of an array `["manager"]` — `.includes()` will check characters! | [withAuth.js](file:///c:/Users/Admin/Desktop/soras_mvp/utils/withAuth.js), [registerStaff](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/%28auth%29/registerStaff/route.js), [submitPayment](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/payment/submitPayment/route.js), [verifyPayment](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/payment/verifyPayment/route.js), [getUploadSignature](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/payment/getUploadSignature/route.js) | 🔴 High |
| `sessionToken` is generated with `crypto.randomUUID()` from `crypto-js` in scan route — but `crypto-js` doesn't have `randomUUID()`. Native crypto does. | [scan/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/storefront/scan/%5BmasterQrCode%5D/route.js) | 🔴 High |
| Access token expiry in `customer.model.js` is hardcoded `"30d"` — way too long for an access token. Staff token uses env var correctly. | [customer.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/customer.model.js) | 🟡 Medium |
| `customerLogin` sets access token cookie maxAge to `30 * 60 * 60` seconds = **30 hours** but comment says "15 mins" | [customerLogin/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/%28auth%29/customerLogin/route.js) | 🟡 Medium |
| `generateAccessAndRefreshToken` utility calls `user.generateRefereshToken()` (typo spelling) but method is defined as `generateRefereshToken` — only works by coincidence because both have the same typo | [generateAccessAndRefreshToken.js](file:///c:/Users/Admin/Desktop/soras_mvp/utils/generateAccessAndRefreshToken.js) | 🟡 Medium |
| `verifyPayment` route is protected with role `"admin"` but the `User` model has no `admin` role in its enum — no one can ever access it | [verifyPayment/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/payment/verifyPayment/route.js) | 🟡 Medium |
| `cron.js` queries `trialExpiresAt` but `Restaurant` model only has `planExpiresAt` — sweep A will never work | [cron.js](file:///c:/Users/Admin/Desktop/soras_mvp/cron.js) | 🟡 Medium |

---

## 🟡 Design / Logic Issues

| Issue | Location |
|---|---|
| `storefront/order/live/route.js` queries `tableNumber` and `sessionToken` on the `Order` model, but the `Order` model schema has no `tableNumber` or `sessionToken` fields — only `tableId` | [live/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/storefront/order/live/route.js) |
| `storefront/order/create/route.js` duplicates the QR session logic that already exists in `scan/route.js` — consider using scan as the single source of session truth | [create/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/storefront/order/create/route.js) |
| `registerCustomer/route.js` exists but there is also a Customer model — not yet reviewed but likely has similar issues | — |
| `restaurant.model.js` imports `jwt` and `bcrypt` but never uses them | [restaurant.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/restaurant.model.js) |
| `customer.model.js` references `this.restaurantId` in `generateAccessToken` but Customer model has no `restaurantId` field | [customer.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/customer.model.js) |
| `dailySummary.js` has `topItems: { type: [TopItemSchema], default: 0 }` — default should be `[]`, not `0` | [dailySummary.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/dailySummary.js) |
| `menuItem.model.js` has no timestamps — hard to audit when items were added/changed | [menuItem.model.js](file:///c:/Users/Admin/Desktop/soras_mvp/models/menuItem.model.js) |
| `onboardRestaurant` returns the raw `manager` object (includes password hash) instead of `createdManager` | [onboardRestaurant/route.js](file:///c:/Users/Admin/Desktop/soras_mvp/app/api/%28auth%29/onboardRestaurant/route.js) — Line 72 |

---

## 📋 Summary — Bug Count

| Severity | Count |
|---|---|
| 🔴 Critical (will crash/break core flows) | **16** |
| 🟡 Medium (security or logic issues) | **8** |
| 🟢 Minor (polish / best practices) | **5+** |

---

## 🚀 Recommended Fix Priority

1. Fix `orderItem.model.js` model cache collision (silent data corruption)
2. Fix missing `OrderItem` import in `order.model.js`
3. Fix `payment.model.js` missing `mongoosePaginate` import
4. Fix all `req.json()` missing `await` calls
5. Fix `withAuth` allowedRoles — pass arrays everywhere
6. Fix `makeOrderReady` typo `"preparng"` → `"preparing"`
7. Fix `verifyOrder` wrong field name `status` → `orderStatus`
8. Fix `res/menu/add` broken imports
9. Fix `storefront/scan` default vs named imports
10. Fix `storefront/order/create` `const` reassignment

