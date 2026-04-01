# PHT-Fashion - MERN E-Commerce Platform

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features List - Customer & Admin](#features-list)
3. [System Architecture & Technology Stack](#system-architecture)
4. [Database Design](#database-design)
5. [Security, Validation & Error Handling](#security-validation-error-handling)
6. [Testing Report Summary](#testing-report)
7. [Development Setup](#development-setup)

---

## Project Overview

**PHT-Fashion** is a full-stack e-commerce application built with the MERN stack (MongoDB, Express, React, Node.js) using TypeScript and modern development practices. The application supports two primary user roles: **Customers** for browsing and purchasing fashion products, and **Admins** for managing inventory, orders, and analytics.

### Quick Facts
- **Architecture**: Monorepo with pnpm workspaces (backend/ and frontend/ packages)
- **Backend**: Node.js 20+ / Express 5 / TypeScript on port 5000
- **Frontend**: React 19 / Vite 7 / TypeScript / TailwindCSS on port 5173
- **Database**: MongoDB with Mongoose ODM (14 collections)
- **Real-time Features**: Socket.IO for customer-admin chat
- **Payment Processing**: PayPal + VNPay integration
- **File Hosting**: Cloudinary for image/video uploads

---

## Features List

### 1. Customer Site Features

#### Browsing & Product Discovery
- **Home Page**: Hero section, category showcase, featured products gallery, "Why Choose Us" section
- **Product Catalog**: Full product listing with persistent filtering and sorting capabilities
- **Category Navigation**: Browse products by fashion categories with dedicated category pages
- **Best Sellers**: Dedicated section highlighting top-selling/trending items
- **Product Search**: Text-based search with MongoDB text indexing on product name and description

#### Advanced Search & Filtering
- **Dynamic Filters**:
  - Price range filtering (minimum and maximum values)
  - Category multi-select filtering
  - Supplier filtering
  - Color and size availability filters
- **Sorting Options**: By relevance, price (ascending/descending), and recency (newest first)
- **Pagination**: Configurable page size (default 10, maximum 100 items per page)
- **Search Suggestions**: Real-time filter options based on available products

#### Product Details & Information
- **Rich Product View**:
  - High-resolution main product image with 4 additional thumbnail images (Cloudinary hosted)
  - Detailed product description, pricing, and stock status indicators
  - Size selector with individual stock tracking (XS, S, M, L, XL variants)
- **Customer Reviews**:
  - 5-star rating system with detailed review submissions
  - Display of all user reviews and ratings
  - Average product rating calculation

#### Shopping Cart Management
- **Guest Cart** (localStorage-based):
  - Automatic 24-hour session expiration
  - Persistent across page reloads
  - Cart stored as `pht_cart` in localStorage
- **Authenticated Cart** (Database-synced):
  - User-specific cart stored in MongoDB
  - Real-time synchronization across devices
  - Automatic merge of guest cart items on login (maximum quantity preserved for duplicates)
- **Cart Operations**:
  - Add products with specific size selection
  - Modify item quantities per size/product combination
  - Change product size (moves item to different size)
  - Remove individual items or clear entire cart
  - Real-time cart update notifications

#### Order Management & Checkout
- **Checkout Flow**:
  - Multi-step checkout: Review items → Enter shipping address → Select payment method → Confirm order
  - Shipping address validation (required fields: fullName, email, phone, street, city, state, zipCode, country)
  - Optional apartment/address line 2 support
- **Shipping Methods**:
  - Standard Shipping
  - Express Shipping
  - Next-Day Delivery
- **Payment Methods** (6 options):
  - Credit Card (Stripe-based processing)
  - PayPal (full OAuth integration with approval flow)
  - Apple Pay
  - Google Pay
  - VNPay (Vietnamese payment gateway with IPN callback)
  - Cash on Delivery (COD)
- **Order Confirmation**:
  - Immediate order number generation (unique, uppercase format)
  - Confirmation page with order summary
  - Email receipt delivery

#### Order Tracking & History
- **Order History Page**:
  - List of all customer orders with complete details
  - Order status tracking: pending → processing → shipped → delivered / cancelled
  - Payment status indicators: pending, paid, failed, refunded
  - Shipping address and method display
  - Applied coupon code information
- **Order Details**:
  - Itemized product breakdown
  - Unit prices and quantities for each item
  - Order subtotal, tax, and total amount breakdown
  - Timestamp of order placement

#### Coupon & Discount System
- **Coupon Application**:
  - Enter coupon code during checkout
  - Validate coupon expiration and usage limits
  - Apply discount amount to order total
  - Display final price with discount

#### User Account & Authentication
- **Registration & Login**:
  - Email-based registration with password creation
  - Secure login with JWT token generation
  - Social authentication support (framework in place)
- **Profile Management** ([Profile.tsx](frontend/src/pages/Profile.tsx)):
  - View personal information: name, email, phone, address
  - Edit profile fields with data validation
  - Avatar upload with Cloudinary integration
  - Change password functionality
- **Authentication Persistence**:
  - JWT access token (15 minutes) + refresh token (7 days)
  - Automatic token refresh when expired
  - httpOnly cookie storage for refresh token security

#### Favorites Management
- **Favorite System**:
  - Guest favorites stored in localStorage (`pht_favorites`)
  - Authenticated favorites synced with MongoDB
  - Add/remove products from favorites
  - Automatic favorite merge on login
  - Quick view of favorited products from wishlist page
  - Price drop notifications (framework in place)

#### Real-Time Customer Support Chat
- **Chat Features**:
  - Initiate conversations with admin support team
  - Text message support with emoji picker
  - Image and video message sharing
  - Product card sharing within chat (product details, pricing, images)
  - Message status tracking (sent, delivered, read)
  - Persistent chat history
- **UI Components**:
  - Floating chat button for easy access
  - Chat popup interface with conversation list
  - Real-time message delivery via Socket.IO

#### Additional Pages & Information
- **About Page**: Company information, brand story, values
- **Contact Page**: Support contact form for general inquiries
- **FAQs**: Frequently asked questions section (framework in place)

---

### 2. Admin Dashboard Features

#### Admin Access & Security
- **Role-Based Access Control**: Restricted to users with `role='admin'` via middleware
- **Email Whitelist**: Only hardcoded admin emails can access dashboard (`thnhphong4869@gmail.com`, `nguyenchithanh2213@gmail.com`)
- **Admin Layout**: Protected routing with `AdminRoute` guard on `/admin/*` routes
- **Audit Trail**: Admin actions logged for compliance

#### Product Management (CRUD)
- **Create Products**:
  - Multi-image upload (1 main + 4 thumbnails) to Cloudinary
  - Fields: name, description, price, category, supplier, stock, product images
  - Size variants configuration (default: XS-XL with 20 units per size)
  - Product status (active/draft/archived)
- **Product Listing**:
  - Display all products with pagination (default 20, max 100)
  - Search by product name/description
  - Filter by category, supplier, stock level
  - Sort by created date, price, stock, name
- **Update Products**:
  - Edit all product fields (name, price, description, category, supplier)
  - Modify product images and thumbnails
  - Update stock levels and size variants
  - Change product status
- **Delete Products**:
  - Soft delete with archive option
  - Hard delete with cascade to related orders/reviews
  - Bulk delete operations (framework in place)

#### Category Management (CRUD)
- **Create Categories**: Add new product categories with name validation
- **List Categories**: Display all categories with product count
- **Update Categories**: Rename categories and update descriptions
- **Delete Categories**: Remove categories with related product reassignment option
- **Category Hierarchy**: Support for parent-child category relationships (framework in place)

#### Inventory & Stock Management
- **Stock Tracking**:
  - Real-time product stock level monitoring
  - Size-specific inventory tracking (ProductSize schema with individual stock counters)
  - Low stock alerts (e.g., products with < 10 units)
  - Stock history and audit trail
- **Stock Operations**:
  - View current stock for each product and size variant
  - Adjust stock levels with reason logging
  - Reserve stock for draft orders (automatic cleanup after 60 seconds)
  - Release stock from cancelled orders
- **Inventory Dashboard**:
  - Stock distribution by category
  - Aging stock identification
  - Reorder point alerts

#### Supplier Management (CRUD)
- **Create Suppliers**: Add new suppliers with name and description
- **Supplier Listing**: View all suppliers with default product count per supplier
- **Update Supplier Info**: Edit supplier name, contact, description
- **Link Products**: Assign/manage products to suppliers
- **Track Supplier Performance**: Product count and sales metrics per supplier

#### Coupon & Promo Management (CRUD)
- **Create Coupons**:
  - Coupon code generation (unique, automatically uppercased)
  - Discount amount configuration (fixed amount, not percentage)
  - Usage limit settings (e.g., max 100 uses)
  - Expiration date configuration
- **Coupon Listing**: View all coupons with usage statistics
- **Update Coupons**: Modify discount amount, usage count, expiration date, status
- **Deactivate/Delete**: Archive or permanently remove expired coupons
- **Usage Tracking**: Monitor coupon usage in orders

#### User Management (Admin Controls)
- **User Listing** ([AdminUsers.tsx](frontend/src/pages/admin/AdminUsers.tsx)):
  - Display all users (customers and admins) with pagination
  - Default 20 users per page (max 100)
  - Sort by created_at (newest first by default)
- **User Search & Filtering**:
  - Search by name, email, or phone number
  - Filter by role (customer / admin)
  - Filter by registration date range
  - Active/inactive user filter
- **User Details View**:
  - User information: name, email, phone, address, avatar
  - Order history and total spending
  - Account creation date and last login
  - Current account status
- **User Profile Modification**:
  - Update user role (customer → admin, admin → customer)
  - Edit user contact information (email, phone)
  - Modify address information
  - Change user name
  - Upload/update user avatar

#### Order Management & Processing
- **Order Listing** ([AdminOrders.tsx](frontend/src/pages/admin/AdminOrders.tsx)):
  - Display all orders with complete details
  - Pagination with customizable page size
  - Real-time order status display
  - Sort by date, status, amount
- **Order Details View**:
  - Customer information (name, email, phone)
  - Shipping address and selected shipping method
  - Itemized product breakdown (product name, size, quantity, unit price)
  - Payment method and payment status
  - Applied coupon code and discount amount
- **Order Status Management** (5-step workflow):
  - **Pending**: Initial order state awaiting confirmation
  - **Processing**: Preparing order for shipment
  - **Shipped**: Order in transit (automatic tracking)
  - **Delivered**: Order received by customer
  - **Cancelled**: Order cancellation with refund processing
- **Payment Status Tracking**:
  - Pending (awaiting payment)
  - Paid (payment confirmed)
  - Failed (payment error)
  - Refunded (partial/full refund issued)
- **Order Actions**:
  - Print order labels/invoices
  - Send order status notifications to customer
  - Manual payment processing/verification
  - Cancel orders with refund

#### Analytics & Reporting Dashboard
- **Dashboard Overview Metrics**:
  - **Total Revenue**: Summarized by selected period with percentage change
  - **Total Orders**: Count of orders by status with trend indicators
  - **Total Customers**: Unique customer count with growth rate
  - **Average Order Value (AOV)**: Mean transaction value
- **Revenue Analytics**:
  - Revenue over time visualization (line chart with Chart.JS)
  - Grouping options: Daily, Weekly, Monthly aggregation
  - Customizable period selection: 1 day, 7 days, 30 days, 90 days, 1 year, custom date range
  - Revenue by product category
- **Product Performance**:
  - Top-selling products by quantity sold
  - Top revenue-generating products
  - Product performance trends over time
- **Order Analytics**:
  - Order count breakdown by status (pending, processing, shipped, delivered, cancelled)
  - Order fulfillment rate percentage
  - Average order processing time
  - Repeat customer rate
- **Customer Insights**:
  - New customer acquisition by period
  - Customer retention rate
  - Top spending customers
- **Data Export**: Export analytics reports to CSV/PDF (framework in place)

#### Admin Chat & Support Management
- **Conversation Management** ([admin.chat.controller.ts](backend/src/controllers/admin.chat.controller.ts)):
  - View all customer conversation threads
  - Message history per conversation
  - Real-time message notifications
  - Unread message count
- **Message Operations**:
  - Send text replies to customers
  - Attach and send images/videos
  - Share product cards with customers
  - Mark messages as read
  - Archive conversations
- **Chat Dashboard**:
  - Priority conversation queue (most recent first)
  - Conversation status indicators
  - Customer detailed view in sidebar
- **Response Templates**: Predefined message templates for common support inquiries

#### Admin Notifications & Alerts
- **Real-Time Notifications**:
  - New order alerts
  - Payment failures or confirmations
  - Low inventory warnings
  - Customer support requests
  - High-value order flagging
- **Notification Center**: Centralized notification history and status

---

## System Architecture

### Overall Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                             │
│                   React 19 + Vite + TypeScript                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Pages: Home, Products, Cart, Checkout, Orders, Profile... │  │
│  │ Components: Product Cards, Cart, Forms, Charts            │  │
│  │ Context API: Auth, Cart, Favorites, Chat                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓ HTTP/WebSocket                      │
│                         (Axios + Socket.IO)                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       BACKEND API LAYER                            │
│                Node.js + Express 5 + TypeScript                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Routes (/api/*): REST endpoints for all resources           │  │
│  │ ├─ auth.route.ts: Register, login, logout, refresh token   │  │
│  │ ├─ product.route.ts: Get products, search, filters         │  │
│  │ ├─ cart.route.ts: Add to cart, update, sync                │  │
│  │ ├─ order.route.ts: Create, track, list orders              │  │
│  │ ├─ admin.*: Product/category/user CRUD, analytics          │  │
│  │ └─ chat.route.ts: Conversations, messages                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ MIDDLEWARE PIPELINE:                                       │  │
│  │ ├─ authenticate: Verify JWT token                          │  │
│  │ ├─ authorize: Role-based access control                    │  │
│  │ ├─ validateRequest: Zod schema validation                  │  │
│  │ └─ error: Global error handling                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ CONTROLLERS: HTTP request handlers                         │  │
│  │ ├─ Parse request body/params/query                         │  │
│  │ ├─ Delegate to service layer                               │  │
│  │ └─ Format and send HTTP response                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ SERVICES: Business logic & database operations             │  │
│  │ ├─ auth.service.ts: JWT, bcrypt, password reset            │  │
│  │ ├─ product.service.ts: Search, filter, pagination          │  │
│  │ ├─ order.service.ts: Order creation, status, tracking      │  │
│  │ ├─ payment.service.ts: PayPal, VNPay processing            │  │
│  │ └─ cloud APIs: Cloudinary images, Nodemailer emails        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ DATA ACCESS LAYER:                                         │  │
│  │ ├─ Models: Mongoose schemas with TypeScript interfaces     │  │
│  │ ├─ Validation: Zod schemas for type-safe validation        │  │
│  │ └─ Client: Mongoose ODM + Redis cache                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ MongoDB Database (Primary Store)                           │  │
│  │ ├─ 14 Collections: User, Product, Order, Cart, etc.        │  │
│  │ ├─ Mongoose ODM for type-safe queries                      │  │
│  │ └─ Indexes on: productId, userId, conversationId, etc.     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Redis Cache (Performance)                                  │  │
│  │ ├─ Search results caching                                  │  │
│  │ └─ Frequently accessed data                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

                     ┌──────────────────────┐
                     │  EXTERNAL SERVICES   │
                     ├──────────────────────┤
                     │ Cloudinary: Images   │
                     │ PayPal: Payments     │
                     │ VNPay: Payments      │
                     │ Nodemailer: Email    │
                     │ Socket.IO: Real-time │
                     └──────────────────────┘
```

### Request Processing Pipeline

Each incoming request follows this pipeline:

```
1. ROUTE HANDLER
   └─→ Receives HTTP request
   
2. MIDDLEWARE STACK (Sequential Execution)
   ├─ validateRequest(schema)
   │  └─ Zod schema validation of body/query/params
   │     ├─ On success: Continue to next middleware
   │     └─ On failure: Return 400 with validation errors
   │
   ├─ authenticate
   │  └─ Extract JWT from Authorization header
   │     ├─ Verify signature with JWT_SECRET
   │     ├─ On success: Attach user payload to req.user
   │     └─ On failure: Return 401 Unauthorized
   │
   └─ authorize(['admin']) (if role-gated)
      └─ Check req.user.role in allowed roles
         ├─ On success: Continue to controller
         └─ On failure: Return 403 Forbidden

3. CONTROLLER
   └─ Parse request (body, params, query)
   └─ Call service method(s)
   └─ Format response
   └─ Send HTTP response (200, 201, etc.)

4. SERVICE LAYER (Database Interactions)
   └─ Query MongoDB via Mongoose
   └─ Apply business logic
   └─ Return result or throw ApiError
   
5. ERROR HANDLING
   ├─ Try-catch in controller
   ├─ ApiError check (typed errors)
   └─ Return error response with appropriate HTTP status
```

### Authentication Flow

```
REGISTRATION:
  ┌──────────┐         ┌─────────────┐         ┌──────────┐
  │  Client  │────────→│ Backend API │────────→│ MongoDB  │
  │ (Browser)│ POST    │  /register  │         │  (users) │
  └──────────┘ email   └─────────────┘         └──────────┘
             password        ↓
                       1. Bcryptjs: hash password (10 salt rounds)
                       2. Store user document
                       3. Return user (password excluded)
                       
LOGIN:
  ┌──────────┐                    ┌─────────────┐
  │  Client  │ POST /login email  │ Backend API │
  └──────────┘ +password          └─────────────┘
       ↑                                 ↓
       │ 1. Verify password with bcryptjs
       │ 2. Create tokens:
       │    - Access Token: 15 minutes (in authorizationheader)
       │    - Refresh Token: 7 days (in httpOnly cookie)
       │ 3. Store refresh token in MongoDB
       │ 4. Return user + tokens
       │
       └─ Response includes:
          - User object (name, email, role)
          - Access token (JSON body)
          - httpOnly refresh token (cookie)
          
AUTHENTICATED REQUEST:
  ┌──────────┐    Authorization: Bearer {accessToken}
  │  Client  │ ──→ POST /api/protected
  └──────────┘         ↓
                 auth.middleware:
                 1. Extract token from header
                 2. Verify signature
                 3. Attach user to req.user
                 4. Continue to controller
                 
TOKEN REFRESH (When access token expires):
  ┌──────────┐    POST /api/auth/refresh-token
  │  Client  │ ──→ with httpOnly refresh cookie
  └──────────┘         ↓
                 1. Verify refresh token
                 2. Check expiration
                 3. Generate new access token
                 4. Return new access token
```

### Frontend State Management

```
React Context API Structure:

1. AuthContext
   ├─ State: user { id, name, email, phone, address, role, avatar }
   ├─ State: isAuthenticated (boolean)
   ├─ Method: login(email, password)
   │  └─ POST /api/auth/login → set tokens, store user
   ├─ Method: logout()
   │  └─ POST /api/auth/logout → clear tokens, redirect
   ├─ Method: updateProfile(data)
   │  └─ PUT /api/auth/profile → update user in DB
   └─ Method: changePassword(oldPwd, newPwd)
      └─ POST /api/auth/change-password

2. CartContext
   ├─ State: items [ { productId, size, quantity, addedAt } ]
   ├─ Method: addToCart(productId, size, quantity)
   │  └─ localStorage (guest) or POST /api/cart (authenticated)
   ├─ Method: removeFromCart(productId, size)
   ├─ Method: updateQuantity(productId, size, quantity)
   ├─ Method: changeSize(productId, oldSize, newSize)
   ├─ Method: clearCart()
   └─ Feature: Auto-merge guest cart on login

3. FavoriteContext
   ├─ State: favoriteIds [ productId ]
   ├─ Method: addFavorite(productId)
   ├─ Method: removeFavorite(productId)
   ├─ Method: isFavorited(productId)
   └─ Feature: toLowerCase localStorage + DB sync

4. ChatContext
   ├─ State: conversations [ { id, customerId, messages } ]
   ├─ State: socketConnected (boolean)
   ├─ WebSocket Events:
   │  ├─ connect: Join conversation room
   │  ├─ receiveMessage: Listen for new messages
   │  ├─ messageDelivered: Delivery confirmation
   │  └─ disconnect: Cleanup on logout
   └─ Method: sendMessage(conversationId, message)
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI Framework - modern hooks, concurrency features |
| **Vite** | 7.2.4 | Build tool and dev server - lightning-fast HMR |
| **TypeScript** | ~5.9.3 | Type safety for JavaScript |
| **React Router** | 7.13.0 | Client-side routing and navigation |
| **TailwindCSS** | 4.1.18 | Utility-first CSS framework for styling |
| **Axios** | 1.13.3 | HTTP client for API requests |
| **Socket.IO Client** | 4.8.1 | Real-time bidirectional communication |
| **Framer Motion** | 12.31.0 | Animation library for React components |
| **Chart.JS** | 4.5.1 | Data visualization for admin analytics |
| **React-I18Next** | 16.6.5 | Internationalization support for i18n |
| **Lucide React** | 0.563.0 | Icon library (1300+ icons) |
| **Emoji Picker React** | 4.18.0 | Emoji selection component for chat |
| **Class Variance Authority** | 0.7.1 | CSS class composition utility |
| **PostCSS** | 8.x | CSS transformation tool for TailwindCSS |

### Backend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20+ LTS | JavaScript runtime |
| **Express** | 5.2.1 | Minimalist web application framework |
| **TypeScript** | 5.9.3 | Type safety for Node.js |
| **Mongoose** | 9.1.5 | MongoDB Object Document Mapper (ODM) |
| **MongoDB** | (cloud)  | NoSQL database for data persistence |
| **Redis** | 5.11.0 | In-memory cache for performance optimization |
| **Socket.IO** | 4.8.1 | Bidirectional event-based communication |
| **JWT** | 9.0.3 | JSON Web Tokens for stateless authentication |
| **Bcryptjs** | 3.0.3 | Secure password hashing (salt rounds: 10) |
| **Cloudinary** | 2.9.0 | Cloud-based image and video storage |
| **Multer** | 2.0.2 | Middleware for file upload handling |
| **Nodemailer** | 7.0.12 | Email service for notifications and password reset |
| **PayPal SDK** | 1.8.1 | PayPal payment processing integration |
| **VNPay** | 2.4.4 | Vietnamese payment gateway integration |
| **Zod** | 4.3.6 | Runtime type-safe schema validation |
| **CORS** | 2.8.6 | Cross-Origin Resource Sharing middleware |
| **ts-node-dev** | 2.0.0 | Auto-restarting development server with TypeScript |

### Package Manager & Workspaces
- **pnpm**: v10.28.1 - Workspace protocol for monorepo dependency management

### Development Tools
- **ESLint**: Code quality and standards enforcement (frontend)
- **TypeScript Compiler**: Type checking and compilation to JavaScript
- **Vite Dev Proxy**: Development proxy routing `/api` to `http://localhost:5000`

---

## Database Design

### MongoDB Collections & Relationships

#### 1. User Collection
**Purpose**: Stores customer and admin account information

```typescript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  role: 'customer' | 'admin',       // User role (hardcoded: 2 roles only)
  name: string,                     // User's full name (required, unique)
  email: string,                    // Email address (required, lowercase, unique)
  phone: string,                    // Contact phone number (required)
  address: string,                  // Street address (required)
  password: string,                 // Bcryptjs hashed password (required)
  avatar?: string,                  // Cloudinary image URL
  created_at: Date                  // Registration timestamp (default: now)
}
```
**Indexes**: email (unique, case-insensitive), name

#### 2. Product Collection
**Purpose**: Fashion product catalog with inventory tracking

```typescript
{
  _id: ObjectId,
  name: string,                     // Product name (indexed for text search)
  description: string,              // Product details (indexed for text search)
  price: number,                    // Price in USD/VND (must be ≥0)
  categoryId: ObjectId,             // Reference to Category collection
  supplierId: ObjectId,             // Reference to Supplier collection
  stock: number,                    // Overall inventory count (≥0)
  img_url: string,                  // Main product image URL (Cloudinary)
  thumbnail_img_1?: string,         // Thumbnail image 2 (Cloudinary)
  thumbnail_img_2?: string,         // Thumbnail image 3 (Cloudinary)
  thumbnail_img_3?: string,         // Thumbnail image 4 (Cloudinary)
  thumbnail_img_4?: string,         // Thumbnail image 5 (Cloudinary)
  sizes: [
    {
      size: string,                 // Size variant (XS, S, M, L, XL)
      stock: number                 // Stock for this specific size
    }
  ],
  created_at: Date                  // Product creation timestamp
}
```
**Indexes**: name (text), description (text), categoryId, supplierId

#### 3. Order Collection
**Purpose**: Customer purchase orders with fulfillment tracking

```typescript
{
  _id: ObjectId,
  orderNumber: string,              // Unique order identifier (uppercase)
  customerId?: ObjectId,            // Reference to User (optional for guest orders)
  status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled',  // Fulfillment status
  subtotal: number,                 // Sum of (unitPrice × quantity) for all items
  shipping_cost: number,            // Shipping fee in currency
  tax: number,                      // Sales tax / VAT
  total_amount: number,             // subtotal + shipping + tax
  payment_status: 'pending'|'paid'|'failed'|'refunded',  // Payment status
  shipping_method: 'standard'|'express'|'next_day',  // Delivery option
  shipping_address: {
    fullName: string,
    email: string,
    phone: string,
    street: string,
    apartment?: string,             // Optional address line 2
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  payment_method: 'credit_card'|'paypal'|'apple_pay'|'google_pay'|'cash_on_delivery'|'vnpay',
  coupon_code?: string,             // Applied coupon code (if any)
  created_at: Date                  // Order placement timestamp
}
```
**Indexes**: orderNumber (unique), customerId, status, created_at

#### 4. OrderItem Collection
**Purpose**: Line items within orders (product × size × quantity)

```typescript
{
  _id: ObjectId,
  orderId: ObjectId,                // Reference to Order (indexed)
  productId: ObjectId,              // Reference to Product
  quantity: number,                 // Units ordered (≥1)
  productSize: string,              // Size ordered (uppercase: XS, S, M, L, XL)
  unit_price: number                // Price snapshot at purchase time
}
```
**Indexes**: orderId (for order item lookup)

#### 5. Cart Collection
**Purpose**: Persistent shopping cart for authenticated users

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                 // Reference to User (unique per user)
  items: [
    {
      productId: ObjectId,          // Reference to Product
      size: string,                 // Size (XS-XL)
      quantity: number,             // Items in cart (≥1)
      addedAt: Date                 // When item was added
    }
  ],
  updatedAt: Date                   // Last modified timestamp
}
```
**Indexes**: userId (unique index)

#### 6. Favorite Collection
**Purpose**: User wishlist/favorites management

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                 // Reference to User (unique)
  productIds: [ObjectId],           // Array of Product IDs
  created_at: Date
}
```
**Indexes**: userId (unique index)

#### 7. Category Collection
**Purpose**: Product category taxonomy

```typescript
{
  _id: ObjectId,
  name: string,                     // Category name (unique)
  created_at: Date
}
```

#### 8. Supplier Collection
**Purpose**: Product supplier/brand management

```typescript
{
  _id: ObjectId,
  name: string,                     // Supplier/brand name (required)
  description: string,              // Brand information
  supplier_img?: string,            // Logo or brand image
  created_at: Date
}
```

#### 9. Coupon Collection
**Purpose**: Discount code management

```typescript
{
  _id: ObjectId,
  name: string,                     // Coupon display name
  code: string,                     // Unique code (uppercase)
  discount: number,                 // Discount amount (fixed, not percentage)
  count: number,                    // Usage limit (0-100)
  expiration_date: Date,            // Coupon validity end date
  created_at: Date
}
```
**Indexes**: code (unique)

#### 10. Review Collection
**Purpose**: Product ratings and customer reviews

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                 // Reference to User (reviewer)
  productId: ObjectId,              // Reference to Product (indexed)
  rating: number,                   // 1-5 star rating (required)
  content: string,                  // Review text (required)
  created_at: Date
}
```
**Indexes**: productId (for product reviews)

#### 11. Message Collection
**Purpose**: Real-time chat messages between customers and admins

```typescript
{
  _id: ObjectId,
  conversationId: ObjectId,         // Reference to Conversation (indexed)
  senderId: ObjectId,               // Reference to User (indexed)
  senderRole: 'customer'|'admin',   // Role of message sender
  type: 'text'|'image'|'video'|'product_card',  // Message type
  content?: string,                 // Text content (for text messages)
  imageUrl?: string,                // Cloudinary image URL
  imagePublicId?: string,           // Cloudinary public ID (for deletion)
  videoUrl?: string,                // Cloudinary video URL
  videoPublicId?: string,           // Cloudinary public ID
  product?: {                       // Shared product details
    productId: ObjectId,
    name: string,
    price: number,
    img_url: string,
    slug: string
  },
  status: 'sent'|'delivered',       // Message delivery status
  createdAt: Date
}
```
**Indexes**: conversationId, senderId

#### 12. Conversation Collection
**Purpose**: Customer-admin chat threads

```typescript
{
  _id: ObjectId,
  customerId: ObjectId,             // Reference to User (indexed)
  lastMessage: {
    content: string,
    sentAt: Date,
    senderId: ObjectId
  },
  customerUnread: number,           // Unread count (customer side)
  adminUnread: number,              // Unread count (admin side)
  createdAt: Date,
  updatedAt: Date                   // Last message timestamp (indexed)
}
```
**Indexes**: customerId, updatedAt

#### 13. RefreshToken Collection
**Purpose**: Secure refresh token storage for session rotation

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                 // Reference to User
  token: string,                    // Hashed refresh token
  expiresAt: Date,                  // Token expiration date (7 days)
  createdAt: Date
}
```

#### 14. PendingPayment Collection
**Purpose**: Draft order recovery for interrupted payments

```typescript
{
  _id: ObjectId,
  userId?: ObjectId,                // Reference to User (guest orders: null)
  orderData: { /* full order object */ },
  paymentData: { /* PayPal or VNPay details */ },
  expiresAt: Date                   // Auto-cleanup after expiration
}
```

### Database Relationships Map

```
User (1) ──→ (N) Order
User (1) ──→ (1) Cart
User (1) ──→ (1) Favorite
User (1) ──→ (N) Review
User (1) ──→ (N) Conversation (as customer)
User (1) ──→ (N) Message (as sender)

Order (1) ──→ (N) OrderItem
Order (1) ──→ (1) Coupon (via coupon_code reference)

Product (1) ──→ (N) OrderItem
Product (1) ──→ (N) Review
Product (N) ──→ (1) Category
Product (N) ──→ (1) Supplier
Product (1) ──→ (1) { sizes[] }  /* embedded document */

Category (1) ──→ (N) Product

Conversation (1) ──→ (N) Message
Conversation (1) ──→ (1) User (customerId)

CartItem: { productId → Product, userId → User via Cart }
FavoriteItem: { productIds[] → Product[], userId → User via Favorite }
```

---

## Security, Validation & Error Handling

### 1. Authentication & RBAC (Role-Based Access Control)

#### JWT Token Implementation
**Token Payload Structure**:
```typescript
interface AuthTokenPayload {
  sub: string,              // User ID (subject)
  role: 'customer'|'admin', // User role
  email: string,            // User email
  iat?: number,             // Issued at (Unix timestamp)
  exp?: number              // Expiration (Unix timestamp)
}
```

**Token Lifecycle**:
- **Access Token**: Validity **15 minutes**
  - Purpose: Authenticating API requests
  - Transmission: HTTP `Authorization: Bearer {token}` header
  - Behavior: Read by JavaScript
  - Storage: Request header (in-memory)
  
- **Refresh Token**: Validity **7 days**
  - Purpose: Obtaining new access tokens
  - Transmission: httpOnly cookie (set on login)
  - Behavior: Automatically sent by browser, JavaScript cannot read
  - Storage: Secure httpOnly cookie + MongoDB RefreshToken collection
  - Path restriction: `/api/auth` (only sent to refresh endpoint)
  
- **Password Reset Token**: Validity **10 minutes**
  - Purpose: Secure password change without login
  - Transmission: URL query parameter
  - Usage: Single-use token

#### Authentication Middleware ([auth.middleware.ts](backend/src/middlewares/auth.middleware.ts))
```typescript
Execution Flow:
1. Extract JWT from Authorization header
   - Format: "Authorization: Bearer {token}"
   - Throw 401 if header missing or malformed
   
2. Verify JWT signature
   - Use JWT_SECRET from environment
   - Validate token has not expired
   - Check token not tampered with
   
3. Decode token payload
   - Extract sub (userId), role, email
   - Attach to req.user for downstream use
   - Call next middleware/controller
   
4. Error Handling
   - ExpiredSignatureError → 401 "Token expired"
   - JsonWebTokenError → 401 "Invalid token"
   - Missing token → 401 "No token provided"
```

#### Role-Based Access Control (RBAC)
**Roles Defined** (Hardcoded):
- **'customer'**: Regular user account, limited permissions
- **'admin'**: Administrative account, full access to dashboard & management features

**Authorization Middleware** ([role.middleware.ts](backend/src/middlewares/role.middleware.ts))
```typescript
authorize(allowedRoles: string[]) Middleware:
  1. Check if req.user exists
     - If not: return 401 Unauthorized
     
  2. Verify req.user.role is in allowedRoles array
     - If yes: call next() → grant access
     - If no: return 403 Forbidden
     
3. Admin Email Whitelist
   - Custom middleware: requireAdminEmail
   - Only hardcoded emails can become admins:
     - thnhphong4869@gmail.com
     - nguyenchithanh2213@gmail.com
   - Returns 403 if user email not whitelisted
   
Example Route Protection:
  POST /api/admin/products
    ├─ authenticate          // Verify logged in
    ├─ authorize(['admin'])  // Check role='admin'
    └─ requireAdminEmail     // Check email whitelist
```

#### Token Refresh Flow
```typescript
GET /api/auth/refresh-token

1. Extract refresh token from httpOnly cookie
2. Verify signature and expiration (7 days)
3. Check token exists in RefreshToken collection
4. Generate new access token (15 minutes)
5. Return new access token in response body
6. New refresh token automatically set in httpOnly cookie

Result: Client can continue API requests with new access token
```

### 2. Request Validation

#### Zod Schema Validation Framework
**Purpose**: Type-safe runtime validation of incoming requests

**Validation Schemas Location**: [backend/src/validations/](backend/src/validations/)

**Validation Examples**:

**Auth Validation** (auth.validation.ts):
```typescript
registerSchema:
  email: string().email("Invalid email").required()
  password: string().min(6, "At least 6 characters").required()
  name: string().min(2, "At least 2 characters").required()

loginSchema:
  email: string().email().required()
  password: string().required()

changePasswordSchema:
  currentPassword: string().required()
  newPassword: string().min(6).required()
  confirmPassword: string().refine(data => data.newPassword === data.confirmPassword)

updateProfileSchema:
  name: string().optional()
  phone: string().optional()
  address: string().optional()
```

**Cart Validation** (cart.validation.ts):
```typescript
addToCartSchema:
  productId: ObjectId().required()
  size: enum(['XS', 'S', 'M', 'L', 'XL']).required()
  quantity: number().min(1).max(999).required()

updateCartSchema:
  quantity: number().min(1).max(999).required()
```

**Order Validation** (implicit in controllers):
```typescript
createOrderSchema:
  items: [{ productId, size, quantity }].min(1)
  shippingAddress: {
    fullName: string().required()
    email: string().email().required()
    phone: string().required()  // Regex pattern for phone
    street: string().required()
    city: string().required()
    state: string().required()
    zipCode: string().required()
    country: string().required()
  }
  shippingMethod: enum(['standard', 'express', 'next_day'])
  paymentMethod: enum(['credit_card', 'paypal', ..., 'vnpay'])
```

#### Validation Middleware Implementation
**File**: [backend/src/middlewares/validateRequest.ts](backend/src/middlewares/validateRequest.ts)

```typescript
validateRequest(schema):
  Returns: Middleware function that:
  
  1. Accepts incoming request
  
  2. Calls schema.parseAsync(req.body)  // Parse & validate
  
  3. On Success:
     - Continue to next middleware/controller
     - Validated body available as req.body
     
  4. On Validation Error (ZodError):
     - Extract field names and error messages
     - Format error array
     - Return HTTP 400 Bad Request
     
     Response Format:
     {
       "message": "Validation failed",
       "errors": [
         { "field": "email", "message": "Invalid email format" },
         { "field": "password", "message": "Must be at least 6 characters" }
       ]
     }

Example Route Usage:
  router.post('/register', validateRequest(registerSchema), authController.register)
  // Validates body against registerSchema before controller executes
```

#### Parameter Validation
**URL Parameter Validation** ([backend/src/middlewares/validateParams.ts](backend/src/middlewares/validateParams.ts))
```typescript
validateParams(schema):
  Similar to validateRequest but validates:
  - req.params (URL path parameters)
  - req.query (URL query strings)
  
Example:
  GET /api/products/:id?category=shirts&maxPrice=100
  
  Validates:
  - :id (path parameter)
  - category query param
  - maxPrice query param
```

### 3. Password Security

#### Bcryptjs Password Hashing
**Configuration**:
- **Salt Rounds**: 10 (default, recommended)
- **Algorithm**: bcryptjs (JavaScript implementation of bcrypt)
- **Hashing Time**: ~100ms per password (intentional to prevent brute-force)

**Implementation** ([auth.controller.ts](backend/src/controllers/auth.controller.ts)):
```typescript
Registration:
  1. Extract password from request body
  2. Generate salt: bcrypt.genSalt(10) → random salt
  3. Hash password: bcryptjs. hash(password, salt)
  4. Store hashed password in user document
  5. Never return password in response

Login Verification:
  1. Extract password from request
  2. Fetch user by email from database
  3. Compare: bcryptjs.compare(incomingPassword, storedHashedPassword)
  4. Result: boolean (true/false)
  5. If false: return 401 "Invalid credentials"

Password Change:
  1. Authenticate user (JWT required)
  2. Verify current password with bcryptjs.compare
  3. If valid: hash newPassword, update in DB
  4. If invalid: return 401 "Current password incorrect"
```

**Security Properties**:
- One-way hashing: Cannot reverse hash to get original password
- Salting: Each password hash is unique even for identical passwords
- Slow by design: Makes rainbow table attacks computationally expensive
- Adaptive: Bcrypt automatically increases difficulty as computers get faster

### 4. Environment Variable Management

**File**: [backend/src/config/env.ts](backend/src/config/env.ts)

**Required Environment Variables**:
```bash
MONGO_URI              # MongoDB connection string (atlas://...)
JWT_SECRET             # Secret key for JWT signing (min 32 chars recommended)
```

**Recommended Optional**:
```bash
PORT=5000              # Express server port (default: 5000)
JWT_EXPIRES=15m        # Access token expiry (overridden to 15m in jwt.ts)
REFRESH_TOKEN_SECRET   # Refresh token signing secret (defaults to JWT_SECRET)
```

**External Service Credentials**:
```bash
# Email (Nodemailer)
EMAIL_USER             # Sender email address
EMAIL_PASS             # Email service password

# Image Hosting (Cloudinary)
CLOUDINARY_NAME        # Cloudinary cloud name
CLOUDINARY_API_KEY     # Cloudinary API key
CLOUDINARY_API_SECRET  # Cloudinary API secret

# Frontend CORS
FRONTEND_URL           # Production frontend URL (e.g., vercel app)
FRONTEND_URL_2         # Secondary frontend URL
```

**Development vs Production**:
- **Development**: HTTPS disabled (cookie secure flag not set)
- **Production**: HTTPS enforced, cookie secure flag enabled (set via NODE_ENV)

### 5. CORS Configuration

**Allowed Origins**:
```typescript
Hardcoded:
  - http://localhost:5173    // Vite dev server (main)
  - http://localhost:5175    // Vite dev server (backup)
  - http://127.0.0.1:5173    // Localhost alternative
  
Environment Variables:
  - FRONTEND_URL             // Production frontend
  - FRONTEND_URL_2           // Secondary deployment
  
Pattern Matching:
  - /^https:\/\/pht-fashion-frontend[a-zA-Z0-9-]*.vercel.app$/
    // Matches: pht-fashion-frontend.vercel.app, pht-fashion-frontend-staging.vercel.app, etc.
```

**Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS

**Allowed Headers**: Content-Type, Authorization, X-Requested-With

**Credentials**: `true` (allows cookies and Authorization headers)

**Exposed Headers**: Content-Disposition (for file downloads)

### 6. Error Handling Architecture

#### Custom Error Class
**File**: [backend/src/utils/api-error.ts](backend/src/utils/api-error.ts)
```typescript
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

Usage:
  throw new ApiError(404, 'Product not found');
  throw new ApiError(409, 'Email already registered');
  throw new ApiError(403, 'Insufficient permissions');
```

#### Error Response Formats

**Validation Error Response** (HTTP 400):
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Must contain at least 8 characters"
    }
  ]
}
```

**Authentication Error** (HTTP 401):
```json
{
  "message": "Unauthorized: Invalid token"
}
```

**Authorization Error** (HTTP 403):
```json
{
  "message": "Forbidden: Admin access required"
}
```

**Not Found Error** (HTTP 404):
```json
{
  "message": "Product not found"
}
```

**Business Logic Error** (HTTP 409/422):
```json
{
  "message": "Email already registered"
}
```

**Server Error** (HTTP 500):
```json
{
  "message": "Internal server error"
}
```

#### Error Handling Pattern in Controllers
```typescript
try {
  // Validate request (middleware handles validation errors)
  
  // Call service layer
  const result = await service.doSomething(params);
  
  // Return success
  return res.status(200).json(result);
  
} catch (error) {
  
  // Handle known errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }
  
  // Handle Mongoose validation errors
  if (error instanceof mongoose.ValidationError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  // Return generic server error
  return res.status(500).json({
    message: 'Internal server error'
  });
}
```

#### Global Error Middleware Status
**File**: [backend/src/middlewares/error.middleware.ts](backend/src/middlewares/error.middleware.ts)

⚠️ **Currently**: Empty implementation
- No global error handler attached to Express
- Error handling is per-controller
- Each controller owns its try-catch blocks

### 7. Data Sanitization & Additional Security

**Password Field Filtering**:
- User responses always exclude `password` field
- MongoDB projection: `{ password: 0 }`

**Rate Limiting** (Framework in place):
- No active implementation yet
- Recommended for: `/auth/login`, `/auth/register`, payment endpoints

**Input Sanitization**:
- Zod handles type coercion and validation
- HTML escaping: Not explicitly implemented (frontend responsible for rendering)
- SQL Injection: N/A (MongoDB uses BSON queries, not SQL)

**HTTPS Enforcement**:
- Development: HTTP allowed (for local testing)
- Production: HTTPS required (via NODE_ENV check)

---

## Testing Report Summary

### Current Testing Status

⚠️ **Important**: No automated test runner is currently configured in this project.

**Test Framework Status**:
- ❌ Jest: Not installed
- ❌ Vitest: Not installed
- ❌ Mocha: Not installed
- ❌ Supertest: Not installed

**Backend package.json Test Script**:
```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### Testing Strategy Employed

**First Line of Defense: Zod Validation**
- All request bodies validated via Zod schemas before business logic
- Invalid input rejected immediately with structured error responses
- Type-safe schema enforcement at request boundary

**Development Testing Approach**:
- **Manual API Testing**: Postman collections for endpoint validation
- **Frontend Testing**: In-browser testing of UI components and flows
- **Integration Testing**: Full user workflows (registration → login → cart → checkout)

### Recommended Test Implementation Plan

If implementing automated testing, the following test categories should be prioritized:

#### 1. **Authentication Tests**

**Login - Valid Credentials**
- **Scenario**: User provides correct email and password
- **Steps**: POST /api/auth/login with valid credentials
- **Expected Result**: 200 OK, access token + refresh token, user object returned

**Login - Invalid Credentials**
- **Scenario**: User provides incorrect password
- **Steps**: POST /api/auth/login with wrong password
- **Expected Result**: 401 Unauthorized, "Invalid credentials" message

**Register - New User**
- **Scenario**: User creates new account with unique email
- **Steps**: POST /api/auth/register with valid email, password, name, phone, address
- **Expected Result**: 201 Created, user object returned (password excluded)

**Register - Duplicate Email**
- **Scenario**: User attempts registration with existing email
- **Steps**: POST /api/auth/register with already-registered email
- **Expected Result**: 409 Conflict, "Email already registered" message

**Register - Missing Fields**
- **Scenario**: User submits incomplete registration form
- **Steps**: POST /api/auth/register without required fields
- **Expected Result**: 400 Bad Request, validation errors for missing fields

**Token Refresh - Valid Token**
- **Scenario**: User requests new access token with valid refresh token
- **Steps**: GET /api/auth/refresh-token with httpOnly refresh cookie
- **Expected Result**: 200 OK, new access token in response

**Token Refresh - Expired Token**
- **Scenario**: User requests new access token but refresh token expired (>7 days)
- **Steps**: GET /api/auth/refresh-token with expired refresh cookie
- **Expected Result**: 401 Unauthorized, "Refresh token expired"

#### 2. **Product Management Tests**

**Get All Products**
- **Scenario**: Fetch product list with default pagination
- **Steps**: GET /api/products?page=1&limit=10
- **Expected Result**: 200 OK, array of 10 products, pagination metadata

**Search Products - Text Match**
- **Scenario**: Search products by name using text index
- **Steps**: GET /api/search?q=shirt
- **Expected Result**: 200 OK, products matching "shirt" in name/description

**Filter by Category**
- **Scenario**: User narrows product list by category
- **Steps**: GET /api/products?category=electronics
- **Expected Result**: 200 OK, only products in specified category

**Filter by Price Range**
- **Scenario**: User filters products by price bounds
- **Steps**: GET /api/products?minPrice=50&maxPrice=200
- **Expected Result**: 200 OK, only products in price range

**Get Product Detail**
- **Scenario**: Fetch specific product with images and reviews
- **Steps**: GET /api/products/:id
- **Expected Result**: 200 OK, product object with all fields + reviews array

**Create Product (Admin)**
- **Scenario**: Admin creates new product with images
- **Steps**: POST /api/admin/products with multipart form (name, images, etc.)
- **Expected Result**: 201 Created, product object with generated ID

**Update Product (Admin)**
- **Scenario**: Admin modifies existing product details
- **Steps**: PUT /api/admin/products/:id with updated fields
- **Expected Result**: 200 OK, updated product object

**Delete Product (Admin)**
- **Scenario**: Admin removes product from catalog
- **Steps**: DELETE /api/admin/products/:id
- **Expected Result**: 200 OK, product archived/deleted

#### 3. **Order Lifecycle Tests**

**Create Order - Valid Data**
- **Scenario**: Customer places valid order with items, shipping, payment method
- **Steps**: POST /api/orders with items, shippingAddress, paymentMethod
- **Expected Result**: 201 Created, order object with orderNumber, status='pending'

**Create Order - Out of Stock**
- **Scenario**: Customer attempts to order product currently out of stock
- **Steps**: POST /api/orders with out-of-stock product
- **Expected Result**: 400 Bad Request, "Product out of stock" message

**Create Order - Invalid Address**
- **Scenario**: Customer submits order missing required address fields
- **Steps**: POST /api/orders without complete shippingAddress
- **Expected Result**: 400 Bad Request, validation errors for missing fields

**Get Order History - Customer**
- **Scenario**: Customer views their order history
- **Steps**: GET /api/orders (authenticated)
- **Expected Result**: 200 OK, array of user's orders

**Update Order Status (Admin) - pending→processing**
- **Scenario**: Admin confirms order and marks as processing
- **Steps**: PATCH /api/admin/orders/:id with status='processing'
- **Expected Result**: 200 OK, order status updated

**Update Order Status - processing→shipped**
- **Scenario**: Admin ships order and updates status
- **Steps**: PATCH /api/admin/orders/:id with status='shipped'
- **Expected Result**: 200 OK, order marked shipped + email notification sent

**Update Order Status - shipped→delivered**
- **Scenario**: Order received by customer, status updated
- **Steps**: PATCH /api/admin/orders/:id with status='delivered'
- **Expected Result**: 200 OK, order marked delivered + delivery email sent

**Cancel Order - Pending Status**
- **Scenario**: Customer cancels order before processing
- **Steps**: DELETE /api/orders/:id (status=pending)
- **Expected Result**: 200 OK, order status='cancelled', stock restored

**Cancel Order - Processing Status**
- **Scenario**: Customer attempts to cancel order already in processing
- **Steps**: DELETE /api/orders/:id (status=processing)
- **Expected Result**: 400 Bad Request, "Cannot cancel processing order"

#### 4. **Cart Management Tests**

**Add to Cart - Guest**
- **Scenario**: Unauthenticated user adds product to cart
- **Steps**: POST /api/cart with productId, size, quantity (no auth token)
- **Expected Result**: 200 OK, cart item added (stored in localStorage)

**Add to Cart - Authenticated**
- **Scenario**: Logged-in user adds product to cart
- **Steps**: POST /api/cart with productId, size, quantity (with auth token)
- **Expected Result**: 201 Created, cart item synced to database

**Update Cart Item Quantity**
- **Scenario**: User increases quantity for existing cart item
- **Steps**: PATCH /api/cart/:productId/:size with quantity=5
- **Expected Result**: 200 OK, quantity updated

**Remove from Cart**
- **Scenario**: User removes product from cart
- **Steps**: DELETE /api/cart/:productId/:size
- **Expected Result**: 200 OK, item removed

**Merge Guest Cart on Login**
- **Scenario**: Guest cart merged with authenticated user's cart after login
- **Steps**: User logs in after having items in guest cart
- **Expected Result**: Guest cart items merged, maximum quantity preserved

#### 5. **Security & Unauthorized Access Tests**

**Access Protected Route Without Token**
- **Scenario**: User attempts to access protected endpoint without JWT
- **Steps**: GET /api/admin/products (no Authorization header)
- **Expected Result**: 401 Unauthorized

**Access Protected Route With Invalid Token**
- **Scenario**: Request includes malformed or expired JWT
- **Steps**: GET /api/admin/products with Authorization: Bearer invalid_token
- **Expected Result**: 401 Unauthorized, "Invalid token"

**Admin Route Access - Non-Admin User**
- **Scenario**: Customer with valid token attempts admin endpoint
- **Steps**: POST /api/admin/products (authenticated as customer)
- **Expected Result**: 403 Forbidden, "Admin access required"

**Admin Email Whitelist - Non-Whitelisted Admin**
- **Scenario**: Admin account with email not in whitelist attempts dashboard access
- **Steps**: Non-whitelisted admin email authentication
- **Expected Result**: 403 Forbidden or login rejection

**Password Hash Verification**
- **Scenario**: Verify stored password is hashed, not plaintext
- **Steps**: Check database user document
- **Expected Result**: Password field contains bcryptjs hash (starts with $2a$ or $2b$)

**CORS - Disallowed Origin**
- **Scenario**: Frontend from non-whitelisted origin attempts API call
- **Steps**: Request from unauthorized domain
- **Expected Result**: CORS preflight rejected, 403 Forbidden

#### 6. **Payment Processing Tests**

**Create Order - Credit Card**
- **Scenario**: User completes checkout with credit card payment
- **Steps**: POST /api/orders with paymentMethod='credit_card'
- **Expected Result**: 201 Created, order pending payment

**Process PayPal Payment**
- **Scenario**: User initiates PayPal payment flow
- **Steps**: POST /api/payments/paypal/create-order with order details
- **Expected Result**: 200 OK, PayPal approval URL returned

**PayPal Payment Callback - Success**
- **Scenario**: PayPal IPN webhook confirms payment
- **Steps**: POST /webhooks/paypal with IPN message (payment completed)
- **Expected Result**: Order status updated to 'paid', 200 OK to PayPal

**PayPal Payment Callback - Failure**
- **Scenario**: PayPal IPN webhook reports failed payment
- **Steps**: POST /webhooks/paypal with IPN message (payment failed)
- **Expected Result**: Order payment_status updated to 'failed'

**VNPay Payment Return**
- **Scenario**: User returns from VNPay gateway after payment attempt
- **Steps**: GET /api/payments/vnpay/return with vnp_ResponseCode=00 (success)
- **Expected Result**: 200 OK, order payment confirmed, redirect to success page

**Duplicate Payment Prevention**
- **Scenario**: User accidentally submits payment twice
- **Steps**: Same order ID sent twice with idempotency key
- **Expected Result**: First payment processed, second rejected (409 Conflict)

### Summary Statistics

| Category | Count |
|----------|-------|
| **Potential Authentication Tests** | 7 |
| **Potential Product Tests** | 8 |
| **Potential Order Lifecycle Tests** | 10 |
| **Potential Cart Tests** | 5 |
| **Potential Security Tests** | 6 |
| **Potential Payment Tests** | 6 |
| **Total Recommended Test Cases** | 42+ |

### Test Implementation Priority

**High Priority** (MVP):
1. Authentication (login, register, token validation)
2. Product CRUD (create, read, update, delete)
3. Order creation and status workflow
4. Authorization checks (admin access, role validation)

**Medium Priority**:
1. Payment processing (PayPal, VNPay)
2. Cart management and guest cart merging
3. Search and filtering accuracy
4. Error handling and validation messages

**Lower Priority**:
1. Analytics endpoint coverage
2. Chat system testing
3. Coupon and discount application
4. Edge case scenarios

---

## Development Setup

### Prerequisites
- Node.js 20+ with npm/pnpm
- MongoDB (local or MongoDB Atlas cloud)
- Cloudinary account for image hosting
- PayPal and VNPay accounts for payment testing

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd PHT-fashion

# Install dependencies (pnpm)
pnpm install

# Create .env file in backend directory
cp backend/.env.example backend/.env
# Update with your credentials (MONGO_URI, JWT_SECRET, etc.)
```

### Running Development Servers
```bash
# Run both frontend and backend concurrently
pnpm dev

# In separate terminals, or individually:
pnpm --filter backend run dev    # Starts on http://localhost:5000
pnpm --filter frontend run dev   # Starts on http://localhost:5173
```

### Build for Production
```bash
pnpm --filter frontend run build  # Creates optimized build
```

---

**Last Updated**: March 29, 2026
**Project Status**: Active Development
