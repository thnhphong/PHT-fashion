# PHT-Fashion E-Commerce Platform
## Project Initiation Document (PID)

**Document Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Draft - Ready for Stakeholder Review  
**Classification:** Internal Use

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Objectives](#2-project-objectives)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [AS-IS Process Understanding](#4-as-is-process-understanding)
5. [Project Scope](#5-project-scope)
6. [Requirements Elicitation](#6-requirements-elicitation)
7. [Analysis & Clarification](#7-analysis--clarification)
8. [Validation Plan](#8-validation-plan)
9. [Estimation & Roadmap](#9-estimation--roadmap)

---

## 1. Executive Summary

### Project Name
**PHT-Fashion E-Commerce Platform** - Complete Digital Marketplace Solution

### Project Vision
Build a scalable, user-centric e-commerce platform that enables fashion retailers to manage inventory, process payments seamlessly, and engage customers through a modern, responsive interface with real-time capabilities.

### Business Case
The fashion e-commerce market requires:
- **Fast transaction processing** with multiple payment options
- **Real-time inventory visibility** to prevent overselling
- **Seamless customer experience** across devices
- **Administrative control** over products, orders, and customer interactions

### Key Success Factors
- Payment processing success rate: >99.5%
- Inventory accuracy: 100% real-time sync
- Platform uptime: 99.9%
- First page load time: <2 seconds
- User registration to first purchase: <5 mins

---

## 2. Project Objectives

### Primary Objectives

| # | Objective | Category | Success Metric |
|---|-----------|----------|-----------------|
| O1 | Establish a fully functional e-commerce platform for fashion products | Business | Platform live with 100+ products |
| O2 | Integrate multiple payment gateways (PayPal, VNPay) for global transactions | Technical | 99.5% payment success rate |
| O3 | Implement real-time inventory management to prevent overselling | Technical | 100% inventory accuracy |
| O4 | Provide administrators with comprehensive analytics and control dashboard | Business | Admin dashboard launched with KPI tracking |
| O5 | Enable real-time customer engagement through chat functionality | Technical | Chat system operational with <2s response time |
| O6 | Support multiple user roles (Customer, Admin, Supplier) | Technical | Role-based access fully implemented |

### Problem Statement

**Current State Issues:**
- Manual inventory tracking leading to stockouts and overselling
- Payment processing delays and failed transactions affecting customer trust
- Lack of real-time visibility into sales and order status
- No customer engagement mechanism post-purchase
- Fragmented user experience across web platforms

**Desired State:**
- Automated, real-time inventory management system
- Reliable, multi-channel payment processing
- Real-time analytics and reporting for business intelligence
- Integrated customer communication platform
- Unified, responsive user experience

---

## 3. Stakeholder Analysis

### 3.1 Stakeholder Inventory

| Stakeholder | Role | Influence | Interest | Key Concerns |
|---|---|---|---|---|
| **C-Level Executive** | Project Sponsor | High | High | ROI, Time-to-Market, Risk Mitigation |
| **Business Owner** | Decision Maker | High | High | Revenue Growth, Operational Efficiency |
| **Finance Manager** | Approver | Medium | Medium | Budget, Cost Control, Profitability |
| **Front-End Customers** | End Users | High | High | User Experience, Security, Payment Reliability |
| **Administrators** | Power Users | High | High | Ease of Use, Comprehensive Controls, Performance |
| **IT Operations** | Technical Stakeholder | Medium | High | Scalability, Uptime, Security, Maintainability |
| **Product Manager** | Feature Owner | High | High | Feature Completeness, Timelines, Quality |
| **Suppliers/Vendors** | End Users | Medium | Medium | Inventory Management, Order Visibility |
| **Technical Team Lead** | Technical Lead | High | High | Architecture, Feasibility, Resources |
| **QA/Testing Team** | Quality Assurance | Medium | High | Test Coverage, Defect Management, Release Quality |

### 3.2 Power/Interest Matrix

```
                     INFLUENCE (Power)
                    High        |        Low
             ────────────────────┼────────────────
      High   │   MANAGE       │  INFORM
      E      │   CLOSELY      │  REGULARLY
      X  ────┼────────────────┼────────────────
      I  Low │   MONITOR      │   MINIMAL
      T      │   SATISFACTION │   EFFORT
      E      │                │
```

### 3.3 Stakeholder Mapping

**Manage Closely (High Power, High Interest):**
- C-Level Executive (Sponsor)
- Business Owner
- Technical Team Lead
- Product Manager

**Keep Satisfied (High Power, Low Interest):**
- Finance Manager
- IT Operations Manager

**Inform Regularly (Low Power, High Interest):**
- Front-End Customers
- QA/Testing Team
- Customer Support Team

**Monitor (Low Power, Low Interest):**
- Suppliers/Vendors
- Data Analysts

### 3.4 Engagement & Communication Strategy

| Stakeholder Group | Communication Frequency | Format | Responsibility |
|---|---|---|---|
| Sponsors & Decision Makers | Weekly | Steering Committee, Status Report | Project Manager |
| Technical Team | Daily | Stand-ups, Slack/Teams | Tech Lead |
| Business Users | Bi-weekly | Demos, User Feedback Sessions | Product Manager |
| All Stakeholders | Monthly | Town Hall, Executive Summary | Project Manager |

---

## 4. AS-IS Process Understanding

### 4.1 Current Technology Stack

**Backend:**
- Node.js/Express 5 with TypeScript
- MongoDB with Mongoose ODM
- Redis for caching
- Socket.IO for real-time communication
- CloudInnary for image management

**Frontend:**
- React 19 with Vite 7
- TailwindCSS v4 for styling
- React Router v7 for navigation
- Context API for state management
- Framer Motion for animations

**Infrastructure:**
- Environment: Docker-ready, nixpacks configuration
- Database: MongoDB Atlas
- Frontend: Vercel deployment
- Message Queue: Redis
- Payment Processors: PayPal & VNPay

### 4.2 Current AS-IS Process Flow

#### A. Product & Inventory Management Flow

```
Supplier/Admin
    ↓
Upload/Create Product
    ↓
Product Stored in MongoDB
    ↓
Images Uploaded to Cloudinary
    ↓
Frontend Displays Product
    ↓
Customer Browses & Adds to Cart
```

**Pain Points:**
- ❌ No real-time stock level visibility across system
- ❌ Manual inventory updates prone to errors
- ❌ No warehouse-level inventory tracking
- ❌ Lack of low-stock alerts or auto-reorder triggers

#### B. Order & Payment Processing Flow

```
Customer
    ↓
Add Items to Cart
    ↓
Checkout
    ↓
Select Payment Method
    ↓
Process Payment (PayPal/VNPay)
    ↓
Store Order in MongoDB
    ↓
Send Confirmation Email
    ↓
Admin Notification
```

**Pain Points:**
- ❌ No real-time transaction status tracking
- ❌ Payment failures not gracefully handled
- ❌ No order-to-inventory synchronization
- ❌ Duplicate order risk during retry scenarios
- ❌ Manual reconciliation of failed vs. successful payments

#### C. Customer Engagement Flow

```
Customer Service
    ↓
Chat Request Created
    ↓
Message Stored in MongoDB
    ↓
Real-time Notification via Socket.IO
    ↓
Admin/Support Team Responds
    ↓
Conversation History Maintained
```

**Pain Points:**
- ❌ No chat history persistence for complex queries
- ❌ No escalation mechanism for complex issues
- ❌ Limited support for concurrent conversations

### 4.3 Gaps & Challenges

| Gap | Current State | Impact | Priority |
|---|---|---|---|
| **Real-time Inventory Sync** | Manual/Batch Processing | Overselling, Customer Dissatisfaction | Critical |
| **Payment Reconciliation** | Semi-Manual | Financial Discrepancies | Critical |
| **Order Tracking** | Basic Status Display | Poor Customer Experience | High |
| **Analytics & Reporting** | Limited Dashboards | Limited Business Intelligence | High |
| **Multi-warehouse Support** | Single Location | Scalability Limitation | Medium |
| **Advanced Coupon Engine** | Basic Discounts | Lost Revenue Opportunities | Medium |

### 4.4 Consolidated Problem Statement

**The PHT-Fashion platform currently lacks:**

1. **Inventory Management Excellence**
   - No real-time stock synchronization
   - Risk of data inconsistency across channels
   - No automated low-stock alerts or restocking triggers

2. **Robust Payment Processing**
   - Manual payment reconciliation required
   - No real-time transaction status visibility
   - Limited error handling and retry logic

3. **Business Intelligence Capabilities**
   - Incomplete analytics dashboard
   - Limited reporting on sales, inventory, and customer behavior
   - No predictive insights for inventory planning

4. **Operational Efficiency**
   - High manual intervention required
   - No automation for routine tasks
   - Limited visibility into operational metrics

**Resolution Required:** Implementation of integrated, real-time inventory and payment management systems with comprehensive analytics and automation capabilities.

---

## 5. Project Scope

### 5.1 Scope Statement

**In-Scope - What WILL Be Delivered:**

#### Phase 1: Inventory Management System (Priority: 1)
- ✅ Real-time inventory tracking with multi-warehouse support
- ✅ Automated low-stock alerts and notifications
- ✅ Inventory adjustment workflows (add, edit, decrease)
- ✅ Stock reservation upon order creation
- ✅ Inventory reports and analytics
- ✅ Supplier management and replenishment tracking
- ✅ Barcode/SKU management

#### Phase 2: Enhanced Payment Processing (Priority: 1)
- ✅ PayPal integration with order synchronization
- ✅ VNPay Vietnam payment gateway integration
- ✅ Real-time payment status tracking
- ✅ Automatic order-to-inventory deduction
- ✅ Payment reconciliation dashboard
- ✅ Failed payment retry mechanism
- ✅ Transaction history and reporting

#### Phase 3: Analytics & Reporting (Priority: 2)
- ✅ Admin dashboard with KPIs:
  - Sales metrics (daily, weekly, monthly)
  - Inventory turnover rates
  - Customer acquisition and retention
  - Payment success/failure rates
- ✅ Exportable reports (CSV, PDF)
- ✅ Real-time data visualization
- ✅ Historical trend analysis

#### Phase 4: Customer Experience Enhancement (Priority: 2)
- ✅ Order tracking with real-time updates
- ✅ Enhanced chat system with file sharing
- ✅ Customer notification system (SMS/Email/In-app)
- ✅ Returns and exchange management
- ✅ Review and rating system with moderation

#### Phase 5: Operations & Support (Priority: 3)
- ✅ Comprehensive API documentation
- ✅ System monitoring and alerting
- ✅ User role-based access control refinement
- ✅ Data backup and disaster recovery procedures
- ✅ Staff training and onboarding materials

### 5.2 Out-of-Scope - What WILL NOT Be Delivered

| Item | Reason | Future Consideration |
|---|---|---|
| Mobile Native App (iOS/Android) | Complex; responsive web sufficient for MVP | Phase 2 (Q3 2026) |
| Advanced ML-based Recommendations | Requires historical data; complex models | Phase 2 (Q4 2026) |
| B2B Marketplace Features | Different business model; separate scope | Future Initiative |
| Social Commerce Integration | Beyond current requirements | Phase 2 |
| Multi-currency Support | Global expansion not immediate priority | Future Enhancement |
| Third-party ERP Integration | Requires stable core first | Phase 2 |
| Subscription/Recurring Payments | Not in current business model | Future Feature |
| Video Product Demonstration | Beyond MVP scope | Enhancement |
| AR/VR Try-On Features | Technology maturity concerns | Future Innovation |

### 5.3 System Boundaries & Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   EXTERNAL SYSTEMS                                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   PayPal     │  │   VNPay      │  │ Cloudinary   │      │
│  │   Payment    │  │   Gateway    │  │   (Images)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Email      │  │  SMS Service │  │ Analytics    │      │
│  │   Provider   │  │  (Twilio)    │  │   Tools      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└────────────────────────┬──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Frontend  │  │   Backend    │  │  Database    │
   │  (React)   │──│  (Node.js)   │──│  (MongoDB)   │
   │  Vite      │  │  Express     │  │              │
   └────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        │                ▼                │
        │           ┌──────────────┐     │
        │           │   Redis      │     │
        │           │  (Caching)   │──────┘
        │           └──────────────┘
        │
   ┌────────────────────────┐
   │    Users/Actors        │
   ├────────────────────────┤
   │ • Customers            │
   │ • Administrators       │
   │ • Suppliers            │
   │ • Support Team         │
   └────────────────────────┘
```

### 5.4 Constraints & Assumptions

**Constraints:**
- Development timeline: 4-5 months for MVP
- Budget: Approved by Finance dept
- Team size: 8-10 developers, 2 QA, 1 DevOps
- External dependencies: Payment gateway approvals
- Compliance: Data protection regulations (GDPR for international)

**Assumptions:**
- MongoDB will remain primary database
- React/Node.js tech stack continues
- Payment providers APIs remain stable
- Team availability: Full-time commitment
- Stakeholder engagement: Weekly participation

---

## 6. Requirements Elicitation

### 6.1 Functional Requirements

#### FR-1: Inventory Management Module

| ID | Requirement | Priority | Description |
|---|---|---|---|
| FR-1.1 | Product Master Data | Critical | Maintain product catalog with SKU, name, price, description, images, attributes |
| FR-1.2 | Stock Level Tracking | Critical | Real-time tracking of inventory across multiple warehouses |
| FR-1.3 | Stock Reservation | Critical | Reserve stock when order is placed; release if order is cancelled |
| FR-1.4 | Low Stock Alert | High | Automated notifications when stock falls below threshold |
| FR-1.5 | Inventory Adjustment | High | Ability to adjust stock for damaged, returned, or lost items |
| FR-1.6 | Stock Transfer | Medium | Transfer inventory between warehouses/locations |
| FR-1.7 | Inventory Reports | Medium | Generate reports on stock levels, turnover, slow-moving items |
| FR-1.8 | Supplier Integration | Medium | Link products to suppliers with pricing and reorder information |

#### FR-2: Payment Processing Module

| ID | Requirement | Priority | Description |
|---|---|---|---|
| FR-2.1 | PayPal Integration | Critical | Accept PayPal payments with order linkage |
| FR-2.2 | VNPay Integration | Critical | Accept VNPay payments for Vietnamese customers |
| FR-2.3 | Payment Status Tracking | Critical | Real-time payment status: pending, completed, failed, refunded |
| FR-2.4 | Order-Payment Sync | Critical | Automatic inventory deduction upon successful payment |
| FR-2.5 | Failed Payment Retry | High | Automated retry mechanism for failed transactions |
| FR-2.6 | Payment Reconciliation | High | Dashboard reconciling system records vs. payment provider |
| FR-2.7 | Refund Processing | High | Initiate and track refunds with inventory restoration |
| FR-2.8 | Transaction Reporting | Medium | Detailed transaction history with settlement information |
| FR-2.9 | Payment Security | Critical | PCI DSS compliance; encrypted payment data storage |

#### FR-3: Order Management Module

| ID | Requirement | Priority | Description |
|---|---|---|---|
| FR-3.1 | Order Creation | Critical | Create Orders linked to payment and inventory |
| FR-3.2 | Order Status Tracking | High | Display order timeline: placed, confirmed, shipped, delivered |
| FR-3.3 | Order History | High | Maintain searchable order history for customers and admins |
| FR-3.4 | Order Cancellation | High | Allow cancellation with automatic inventory restoration |
| FR-3.5 | Returns & Exchanges | Medium | Manage product returns and exchanges with refunds |

#### FR-4: Analytics & Reporting

| ID | Requirement | Priority | Description |
|---|---|---|---|
| FR-4.1 | Sales Dashboard | High | Display total sales, revenue, order count, trends |
| FR-4.2 | Inventory Analytics | High | Turnover rate, slow-moving items, reorder levels |
| FR-4.3 | Customer Analytics | Medium | Customer acquisition cost, lifetime value, retention |
| FR-4.4 | Payment Analytics | High | Success rates, failure reasons, payment method preferences |
| FR-4.5 | Custom Reports | Medium | User-configurable reports for different stakeholders |
| FR-4.6 | Data Export | Medium | Export reports to CSV, PDF, Excel formats |

#### FR-5: User & Role Management

| ID | Requirement | Priority | Description |
|---|---|---|---|
| FR-5.1 | Customer Registration | Critical | Create account with email verification |
| FR-5.2 | Admin Authentication | Critical | Secure login with JWT tokens |
| FR-5.3 | Role-Based Access Control | High | Enforce permissions: customer, admin, supplier, support staff |
| FR-5.4 | User Profile Management | High | Update personal information, preferences, notification settings |

#### FR-6: Communication & Notifications

| ID | Requirement | Priority | Description |
|---|---|---|---|
| FR-6.1 | In-app Chat | High | Real-time messaging between customers and support |
| FR-6.2 | Email Notifications | High | Order confirmations, shipping updates, promotional content |
| FR-6.3 | SMS Notifications | Medium | Critical alerts via SMS (OTP, payment confirmation) |
| FR-6.4 | In-app Notifications | Medium | Payment status, order updates, promotions |

### 6.2 Non-Functional Requirements

| Category | Requirement | Target | Measurement |
|---|---|---|---|
| **Performance** | API Response Time | < 500ms (p95) | APM Tools |
| | Page Load Time | < 2 seconds | Lighthouse, WebPageTest |
| | Database Query Time | < 100ms (p95) | Query Logs |
| **Availability** | System Uptime | 99.9% (33.6 mins/month) | Infrastructure Monitoring |
| | Graceful Degradation | Non-critical services down; core functions available | Manual Testing |
| **Scalability** | Concurrent Users | Support 10,000 concurrent users | Load Testing |
| | Database Capacity | 100M+ records | Stress Testing |
| | API Rate Limiting | 1000 req/min per user | Load Testing |
| **Security** | Authentication | JWT with 15-min access token lifespan | Code Review, Penetration Testing |
| | Data Encryption | TLS 1.3 for transit; AES-256 at rest | Security Audit |
| | Password Hashing | bcryptjs with salt rounds = 12 | Code Review |
| | PCI DSS Compliance | Level 1 compliance | Compliance Audit |
| **Reliability** | Error Rate | < 0.1% HTTP 5xx errors | Application Metrics |
| | Data Consistency | ACID transactions for financial operations | Integration Tests |
| | Backup Recovery | RPO: 4 hours; RTO: 30 minutes | DR Testing |
| **Usability** | Mobile Responsiveness | 100% responsive on devices 320px+ | Manual Testing |
| | Accessibility | WCAG 2.1 AA compliance | Accessibility Audit |
| | User Training | Admin staff trained within 1 day | Training Validation |
| **Maintainability** | Code Coverage | >80% for critical paths | SonarQube |
| | Documentation | 100% API documentation (Swagger/OpenAPI) | Code Review |
| | Deployment Frequency | Bi-weekly releases | Release Schedule |

### 6.3 Business Rules

| Rule ID | Business Rule | Trigger | Action |
|---|---|---|---|
| BR-1 | Inventory Reservation | Order created & payment initiated | Reserve quantity; expire if payment fails within 30 mins |
| BR-2 | Stock Adjustment | Successful payment received | Deduct quantity from inventory immediately |
| BR-3 | Low Stock Alert | Stock < Minimum Level | Send alert to supplier & admin; flag for reorder |
| BR-4 | Payment Retry | Payment fails | Retry automatically 2x within 24 hours; notify customer |
| BR-5 | Order Cancellation | Customer/Admin initiates | Cancel order; restore inventory; refund payment; notify customer |
| BR-6 | Coupon Validity | Customer applies coupon | Validate: expiration date, usage count, min. order value, applicable categories |
| BR-7 | Refund Processing | Return approved | Process refund within 5 business days; restore inventory |
| BR-8 | Customer Tier | Customer cumulative spending | Tier 1: $0-500; Tier 2: $500-5K; Tier 3: $5K+; apply tier discounts |
| BR-9 | Admin Authorization | Admin role access | Only admins can: modify inventory, process refunds, access analytics |
| BR-10 | Audit Trail | Critical operations | Log all financial transactions, inventory changes, user actions |

### 6.4 User Story List

**Epic 1: Product Management**

```
User Story 1.1:
AS AN Administrator
WHEN I add a new product to the catalog
THEN the product should be immediately visible in the frontend
AND inventory should be initialized at the specified level
ACCEPTANCE CRITERIA:
  • Product metadata is stored in MongoDB
  • Images are uploaded to Cloudinary
  • Search index is updated within 5 seconds
  • Product appears in "New Arrivals" section
```

```
User Story 1.2:
AS AN Administrator
WHEN inventory falls below the minimum threshold
THEN I should receive an automated alert
AND the product should be flagged in the inventory dashboard
ACCEPTANCE CRITERIA:
  • Alert sent via email and in-app notification
  • Flag visible within 1 minute of threshold breach
  • Configurable threshold per product
```

**Epic 2: Payment Processing**

```
User Story 2.1:
AS A Customer
WHEN I select PayPal as payment method
AND complete the PayPal checkout
THEN my order should be created immediately
AND my inventory should be reserved/deducted
ACCEPTANCE CRITERIA:
  • Payment status updates within 2 seconds
  • Order confirmation email sent within 1 minute
  • Inventory adjustment reflects in real-time
  • Order visible in "My Orders" within 5 seconds
```

```
User Story 2.2:
AS AN Administrator
WHEN I view the payment reconciliation dashboard
THEN I should see pending, successful, and failed transactions
AND a summary comparison of system records vs. payment provider
ACCEPTANCE CRITERIA:
  • All transactions displayed with status, amount, timestamp
  • Discrepancies highlighted in red
  • Export functionality available (CSV, PDF)
  • Default view: last 30 days; date range selectable
```

**Epic 3: Order Management**

```
User Story 3.1:
AS A Customer
WHEN I place an order
THEN I should be able to track its status in real-time
INCLUDING estimated delivery date
ACCEPTANCE CRITERIA:
  • Order timeline visible: placed → confirmed → shipped → delivered
  • Real-time updates push to frontend via WebSocket
  • Tracking number provided when available
  • SMS/Email notification on status changes
```

```
User Story 3.2:
AS A Customer
WHEN I decide to cancel an order
AND the order hasn't shipped yet
THEN my payment should be refunded
AND the inventory should be restored
ACCEPTANCE CRITERIA:
  • Cancellation confirmation displayed immediately
  • Refund processed within 24 hours
  • Inventory restored within 1 minute
  • Confirmation email sent
  • Cancelled items appear in return recommendations
```

**Epic 4: Analytics & Reporting**

```
User Story 4.1:
AS AN Administrator
WHEN I access the sales dashboard
THEN I should see key metrics

:
  • Total sales (today, this week, this month)
  • Revenue trends with visual charts
  • Top-selling products
  • Order count by status
ACCEPTANCE CRITERIA:
  • Dashboard loads within 3 seconds
  • Charts are interactive; hover for details
  • Date range is selectable
  • Data refreshes every 5 minutes
  • Export as PDF report available
```

```
User Story 4.2:
AS AN Administrator
WHEN I view inventory analytics
THEN I should see insights on:
  • Stock turnover rates
  • Slow-moving/dead stock
  • Stockout history
  • Supplier performance
ACCEPTANCE CRITERIA:
  • Items ranked by turnover rate
  • Slow-moving items flagged for promotion/discount
  • Prediction: when stock will run out
  • Supplier metrics: on-time delivery, quality
```

---

## 7. Analysis & Clarification

### 7.1 Use Case Diagram

```
                    ╔════════════════════════════════════════════════╗
                    ║   PHT-Fashion E-Commerce Use Cases              ║
                    ╚════════════════════════════════════════════════╝

    ┌──────────────┐                            ┌──────────────┐
    │   Customer   │                            │ Administrator│
    └──────────────┘                            └──────────────┘
           │                                            │
           │         ┌─ Browse Products ────────────┐  │
           ├────────→│ Search & Filter              │  │
           │         └──────────────────────────────┘  │
           │                                           │
           │         ┌──────────────────────────────┐  │
           ├────────→│ Add to Cart                  │  │
           │         └──────────────────────────────┘  │
           │                                           │
           │         ┌──────────────────────────────┐  │
           │        ╱─│ Checkout & Pay              │  │
           │       ╱  ├──────────────────────────────┤  │
           ├──────→│  ├── PayPal Integration        │  │
           │       ╲  ├── VNPay Integration         │  │
           │        ╲─├── Order Confirmation        │  │
           │          └──────────────────────────────┘  │
           │                                           │
           │         ┌──────────────────────────────┐  ├─→ │ Manage Products │
           │         │ View Order Status            │  │   └──────────────────┘
           ├────────→├──────────────────────────────┤  │
           │         │ Track Shipment               │  ├─→ │ Inventory Mgmt  │
           │         │ Request Support (Chat)       │  │   └──────────────────┘
           │         └──────────────────────────────┘  │
           │                                           ├─→ │ Payment Recon   │
           │         ┌──────────────────────────────┐  │   └──────────────────┘
           ├────────→│ Submit Review & Ratings      │  │
           │         │ Manage Returns/Exchanges     │  ├─→ │ View Analytics  │
           │         └──────────────────────────────┘  │   └──────────────────┘
           │                                           │
    ┌──────────────┐                            ├─→ │ Role Management │
    │ Support Team │                            │   └──────────────────┘
    └──────────────┘                            │
           │                                     ├─→ │ Chat Management │
           │                                     │   └──────────────────┘
           ├─────────────────────────────────────┤
           │         ┌──────────────────────────┐ │
           ├────────→│ Respond to Customer Chat │ │
           │         │ View Conversation Hist.  │ │
           │         └──────────────────────────┘ │
           │                                      │
           │         ┌──────────────────────────┐ │
           └────────→│ Process Returns/Refunds  │ │
                     └──────────────────────────┘ │
                                                  │
                    ┌──────────────┐              │
                    │ Payment Sys  │←─────────────┘
                    │ (PayPal/VNPay)              
                    └──────────────┘
                           ▲
                           │
                    ┌──────────────┐
                    │   MongoDB    │
                    │   (Data)     │
                    └──────────────┘
                           ▲
                           │
                    ┌──────────────┐
                    │   Redis      │
                    │  (Cache)     │
                    └──────────────┘
```

### 7.2 Activity Diagram: Order Processing & Payment Flow

```
                            START: Customer Places Order
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │ Validate Cart Items             │
                    │ • Check product availability    │
                    │ • Verify quantity in stock      │
                    └────────┬────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │ Valid Items?     │──NO──→ ABORT: Return to Cart
                    └────────┬─────────┘
                             │ YES
                    ┌────────▼──────────────────────┐
                    │ Reserve Inventory             │
                    │ (Create Reservations)         │
                    └────────┬──────────────────────┘
                             │
                    ┌────────▼──────────────────────┐
                    │ Create Order (PENDING)        │
                    │ • Order ID generated          │
                    │ • Status: PENDING_PAYMENT    │
                    └────────┬──────────────────────┘
                             │
                    ┌────────▼──────────────────────┐
                    │ Redirect to Payment Gateway  │
                    │ • PayPal or VNPay            │
                    └────────┬──────────────────────┘
                             │
                    ┌────────▼──────────────────────┐
                    │ Customer Completes Payment   │
                    └────────┬──────────────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Payment Successful? │
                    └────┬───────────┬────┘
                         │ YES       │ NO
                         │           │
            ┌────────────▼─┐   ┌────────▼──────────────┐
            │ Update Order │   │ Payment Failed        │
            │ CONFIRMED    │   │ • Retry notification │
            │              │   │ • Cancel reservation │
            └────────┬─────┘   │ • Release inventory  │
                     │         └──→ ABORT
                     │
            ┌────────▼─────────────────────┐
            │ Deduct Inventory             │
            │ • Update Stock Levels        │
            │ • Release Reservations       │
            └────────┬─────────────────────┘
                     │
            ┌────────▼──────────────────────────┐
            │ Create Invoice & Notify Admin     │
            │ • Send Order Confirmation Email   │
            │ • Trigger Fulfillment Workflow    │
            └────────┬───────────────────────────┘
                     │
            ┌────────▼──────────────────────┐
            │ Update Analytics              │
            │ • Sales metrics               │
            │ • Inventory turnover          │
            │ • Payment success rate        │
            └────────┬──────────────────────┘
                     │
                     ▼
              END: Order Completed
```

### 7.3 Inventory Management State Machine

```
                    ┌──────────────────┐
                    │   NEW PRODUCT    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
        Create ────→│ STOCK_AVAILABLE  │←──── Return Item
     Inventory      └────────┬─────────┘      (Inc. Qty)
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼ (Stock < Threshold)         ▼ (Order Placed)
        ┌──────────────┐            ┌──────────────┐
        │ LOW_STOCK    │            │ RESERVED     │
        │ (Alert Sent) │            │ (Qty Hold)   │
        └──────┬───────┘            └──────┬───────┘
               │                           │
               │ (Replenishment)           │ (Payment Success)
               │                           │
               ├──────────────┬────────────┘
               │              │
               ▼              ▼
        ┌──────────────────────────┐
        │ STOCK_AVAILABLE          │
        │ (Qty Updated)            │
        └──────────────────────────┘
               ▲
               │ (Refund/Cancel)
               │
        ┌──────────────┐
        │ RESERVED     │
        │ (Qty Hold)   │
        └──────────────┘
               │
               │ (Reservation Expired)
               │
        ┌──────────┐
        │ RELEASED │
        └──────────┘
```

### 7.4 Entity-Relationship Diagram (ERD)

```
┌──────────────────────────────────────────────────────────────────┐
│                    PHT-Fashion Database Schema                    │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌────────────────────────┐
│  User               │         │  Product               │
├─────────────────────┤         ├────────────────────────┤
│ _id (PK)            │         │ _id (PK)               │
│ email (UNIQUE)      │         │ name                   │
│ password_hash       │         │ sku (UNIQUE)           │
│ first_name          │         │ description            │
│ last_name           │         │ price                  │
│ phone               │         │ images []              │
│ role                │         │ category_id (FK)       │
│ address             │         │ supplier_id (FK)       │
│ created_at          │         │ stock_level            │
│ updated_at          │         │ min_stock_level        │
│ is_active           │         │ created_at             │
└─────────────────────┘         │ updated_at             │
         │ 1                     └────────────────────────┘
         │                                │ N
         │ N        ┌──────────────┐      │
         ├─────────→│ Order        │←─────┤
         │          └──────────────┘      │
         │                                │
    ┌────────────────────────────┐  ┌────────────────────┐
    │ Order                       │  │ OrderItem          │
    ├────────────────────────────┤  ├────────────────────┤
    │ _id (PK)                   │  │ _id (PK)           │
    │ user_id (FK)               │  │ order_id (FK)      │
    │ order_date                 │  │ product_id (FK)    │
    │ status                     │  │ quantity           │
    │ total_amount               │  │ unit_price         │
    │ payment_id (FK)            │  │ subtotal           │
    │ shipping_address           │  └────────────────────┘
    │ tracking_number            │
    │ created_at                 │
    │ updated_at                 │
    └────────┬────────────────────┘
             │ 1
             │ Payment
    ┌────────▼──────────────────┐
    │ Payment                    │
    ├────────────────────────────┤
    │ _id (PK)                   │
    │ order_id (FK)              │
    │ user_id (FK)               │
    │ amount                     │
    │ currency                   │
    │ status                     │
    │ payment_method             │
    │ transaction_id             │
    │ payment_date               │
    │ created_at                 │
    └────────────────────────────┘
             │ 1
             │ PendingPayment
    ┌────────▼──────────────────┐
    │ PendingPayment             │
    ├────────────────────────────┤
    │ _id (PK)                   │
    │ order_id (FK)              │
    │ status                     │
    │ retry_count                │
    │ last_attempt               │
    │ expires_at                 │
    └────────────────────────────┘

┌────────────────────────┐    ┌──────────────────────────┐
│ Category               │    │ Supplier                 │
├────────────────────────┤    ├──────────────────────────┤
│ _id (PK)               │    │ _id (PK)                 │
│ name                   │    │ company_name             │
│ description            │    │ contact_person           │
│ parent_category_id (FK)│    │ email                    │
│ created_at             │    │ phone                    │
│ updated_at             │    │ address                  │
└────────────────────────┘    │ payment_terms            │
         ▲                     │ is_active                │
         │ 1                   │ created_at               │
         │                     │ updated_at               │
         │ N                   └──────────────────────────┘
         │
    ┌────────────────────────┐
    │ Product                │
    │ (Foreign Key)          │
    └────────────────────────┘

┌──────────────────────────────┐   ┌──────────────────────────────┐
│ Inventory                     │   │ InventoryReservation         │
├──────────────────────────────┤   ├──────────────────────────────┤
│ _id (PK)                     │   │ _id (PK)                     │
│ product_id (FK)              │   │ inventory_id (FK)            │
│ warehouse_location           │   │ order_id (FK)                │
│ quantity_on_hand             │   │ quantity_reserved            │
│ quantity_reserved            │   │ reservation_date             │
│ quantity_available           │   │ expiry_date                  │
│ last_counted                 │   │ status                       │
│ reorder_point                │   │ created_at                   │
│ created_at                   │   │ updated_at                   │
│ updated_at                   │   └──────────────────────────────┘
└──────────────────────────────┘

┌──────────────────────────────┐   ┌──────────────────────────────┐
│ Message                       │   │ Conversation                 │
├──────────────────────────────┤   ├──────────────────────────────┤
│ _id (PK)                     │   │ _id (PK)                     │
│ conversation_id (FK)         │   │ customer_id (FK)             │
│ sender_id (FK)               │   │ support_agent_id (FK)        │
│ message_text                 │   │ subject                      │
│ timestamp                    │   │ status                       │
│ is_read                      │   │ created_at                   │
│ updated_at                   │   │ updated_at                   │
└──────────────────────────────┘   │ resolved_at                  │
                                    └──────────────────────────────┘
```

### 7.5 Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│  React 19 + Vite 7 + TypeScript + TailwindCSS v4                │
│  ├─ Authentication (JWT Tokens in localStorage)                 │
│  ├─ Shopping Cart (Context API)                                 │
│  ├─ Order Tracking                                              │
│  ├─ Payment UI (Redirect to PayPal/VNPay)                       │
│  ├─ Analytics Dashboard (Charts & Tables)                       │
│  ├─ Admin Panel (Product/Inventory/Payment Management)          │
│  └─ Real-time Chat (Socket.IO WebSocket)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / REST API / Socket.IO
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  Express 5 + TypeScript                                         │
│  ├─ Request Validation (Zod Schemas)                            │
│  ├─ JWT Authentication Middleware                               │
│  ├─ Role-Based Authorization (RBAC)                             │
│  ├─ Error Handling (Centralized)                                │
│  ├─ CORS Configuration                                          │
│  └─ Rate Limiting & Throttling                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                           │
│  Service Classes & Controllers                                  │
│  ├─ Auth Service (Login, Register, Token Management)            │
│  ├─ Product Service (CRUD, Search, Filtering)                   │
│  ├─ Inventory Service (Stock Management, Reservations)          │
│  ├─ Order Service (Order Creation, Status Updates)              │
│  ├─ Payment Service (PayPal/VNPay Integration, Reconciliation)  │
│  ├─ Analytics Service (KPI Calculation, Reports)                │
│  ├─ Chat Service (Message Handling, Notifications)              │
│  └─ Notification Service (Email, SMS, In-app)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    DATA ACCESS LAYER                            │
│  Mongoose ODM + TypeScript Models                               │
│  ├─ User Model (Authentication & Profiles)                      │
│  ├─ Product Model (Catalog Management)                          │
│  ├─ Inventory Model (Stock & Reservations)                      │
│  ├─ Order Model (Order Lifecycle)                               │
│  ├─ Payment Model (Transaction Tracking)                        │
│  ├─ Message Model (Chat History)                                │
│  ├─ Conversation Model (Chat Threads)                           │
│  ├─ Coupon Model (Promotions)                                   │
│  └─ Review Model (Ratings & Feedback)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   MongoDB         Redis            External
   (Persistent)    (Cache)          Services
                                    │
                   ┌────────────┬────┼────────┬─────────┐
                   ▼            ▼    ▼        ▼         ▼
               PayPal         VNPay Email   Cloudinary SMS
              Gateway        Gateway    Provider      API    Provider
```

### 7.6 Critical Feasibility & Logic Considerations

#### A. Inventory Reservation Mechanism

**Challenge:** Prevent overselling when multiple orders are placed concurrently.

**Solution:**
- Use MongoDB transactions (ACID-compliant)
- Reservation flow:
  1. Check `Inventory.quantity_available ≥ Order.total_quantity`
  2. Create `InventoryReservation` document
  3. Update `Inventory.quantity_reserved += qty`
  4. Update `Inventory.quantity_available -= qty`
  5. If payment fails, release reservation and restore inventory

**Implementation:**
```javascript
// Pseudo-code
async function reserveInventory(orderId, items) {
  const session = await db.startSession();
  session.startTransaction();
  
  try {
    for (let item of items) {
      const inv = await Inventory.findOneAndUpdate(
        { product_id: item.product_id, quantity_available: { $gte: item.qty } },
        { $inc: { quantity_reserved: item.qty, quantity_available: -item.qty } },
        { session }
      );
      
      if (!inv) throw new Error("Insufficient stock");
      
      await InventoryReservation.create([{
        order_id: orderId,
        product_id: item.product_id,
        quantity_reserved: item.qty,
        status: 'RESERVED'
      }], { session });
    }
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    // Release previous reservations
    throw error;
  }
}
```

#### B. Payment Reconciliation Logic

**Challenge:** Ensure system records match payment provider records; handle failed transactions gracefully.

**Solution:**
- Store all payment states: pending, completed, failed, refunded
- Implement webhook handling for real-time payment updates
- Daily reconciliation batch:
  1. Query `Payment.status = 'PENDING'` transactions
  2. Call payment provider API to verify status
  3. Update `Payment` and `Order` status accordingly
  4. Log discrepancies for manual review
  5. Send alerts for unreconciled transactions >24 hours old

**Retry Logic:**
- First automatic retry: immediately after failure
- Second attempt: after 5 minutes
- Manual retry: available after 24 hours

#### C. Real-Time Inventory Updates

**Challenge:** Inventory levels must be accurate across frontend and admin dashboard in real-time.

**Solution:**
- Use Socket.IO to broadcast inventory updates
- Emit events:
  - `inventory:updated` → product stock level changed
  - `inventory:reserved` → qty reserved for pending order
  - `inventory:released` → reservation expired or cancelled
- Frontend subscribes to relevant product events
- Cache invalidation: Clear Redis cache on inventory change

#### D. Order-to-Payment-to-Inventory Synchronization

**Challenge:** Ensure atomicity across three systems.

**Solution - Saga Pattern:**
```
[1] Order Created (PENDING_PAYMENT)
         ↓
[2] Payment Initiated → Payment Provider
         ↓
[3a] Payment Success → Order Status: CONFIRMED
          ↓
[4a] Inventory Deducted → Qty Reduced, Reservation Released
          ↓
[5a] Customer Notified
          ↓
    [COMPLETE]

    OR

[3b] Payment Failed → Order Status: PAYMENT_FAILED
          ↓
[4b] Reservation Released → Qty Restored
          ↓
[5b] Customer Notified, Retry Offered
          ↓
    [RETRY AVAILABLE]
```

---

## 8. Validation Plan

### 8.1 Stakeholder Sign-Off & Confirmation Strategy

| Phase | Activity | Stakeholders | Format | Timeline |
|---|---|---|---|---|
| **Kickoff** | Confirm understanding of objectives, scope, requirements | Sponsors, Tech Lead, Product Manager | Written Approval | Week 1 |
| **Design Review** | Validate architecture, database design, API contracts | Technical Team, Architects | Sign-off on Design Doc | Week 2-3 |
| **Prototype Demo** | Review working prototypes for critical flows | Business Owners, Key Users | Live Demo + Q&A | Week 4 |
| **UAT Planning** | Define test scenarios and acceptance criteria | Business Users, QA Team | UAT Plan Document | Week 3-4 |
| **Beta Testing** | Test with representative sample of end-users | Customer Panel, Admins | Feedback Form | Week 8-9 |
| **Final Sign-Off** | Approve readiness for production deployment | Project Sponsor, Exec Team | Go/No-Go Decision | Week 10 |

### 8.2 Acceptance Criteria Validation Matrix

| Requirement | Validation Method | Owner | Pass Criteria |
|---|---|---|---|
| Real-time inventory accuracy | Automated test + manual verification | QA + BA | 100% accuracy within 5 seconds |
| Payment reconciliation | Reconciliation report audit | Finance + Tech | 100% matching records |
| API response time (< 500ms p95) | Load testing + APM monitoring | DevOps | Consistent <500ms under 10K users |
| 99.9% uptime | Monitoring & SLA reporting | Ops | 33.6 mins downtime/month acceptable |
| Security compliance (PCI DSS L1) | Third-party audit | Security | Full compliance certification |
| User experience | UAT with end-users | Product Manager | ≥80% satisfaction in surveys |
| Admin usability (1-day training) | Staff training & competency test | Training Team | 100% of staff trained & certified |

### 8.3 User Acceptance Testing (UAT) Scenarios

**Scenario 1: Complete Order-to-Delivery Flow**
```
GIVEN: Customer logged in, product in cart
WHEN: Customer completes checkout with PayPal
THEN: 
  ✓ Payment processed successfully
  ✓ Order status updated to CONFIRMED within 2 seconds
  ✓ Inventory adjusted immediately
  ✓ Confirmation email received within 1 minute
  ✓ Order visible in customer dashboard
  ✓ Admin receives order notification
```

**Scenario 2: Concurrent Purchase Handling**
```
GIVEN: 100 concurrent users attempting to buy last 50 units
WHEN: All users initiate checkout simultaneously
THEN:
  ✓ First 50 orders succeed
  ✓ Remaining 50 receive "Out of Stock" message
  ✓ No duplicate orders
  ✓ Inventory shows 0 units
```

**Scenario 3: Payment Failure & Retry**
```
GIVEN: Order placed with PayPal selected
WHEN: Payment gateway returns temporary failure
THEN:
  ✓ Order status: PAYMENT_FAILED
  ✓ Customer notified with retry option
  ✓ Inventory reservation released
  ✓ Auto-retry triggered after 5 minutes
  ✓ Manual retry available for 24 hours
```

**Scenario 4: Admin Inventory Management**
```
GIVEN: Admin accessing inventory dashboard
WHEN: Admin updates product stock level
THEN:
  ✓ Change reflected immediately in dashboard
  ✓ Frontend updated via Socket.IO within 1 second
  ✓ If low stock threshold breached, alert generated
  ✓ Change logged in audit trail
```

**Scenario 5: Analytics Accuracy**
```
GIVEN: Multiple orders processed on specific date
WHEN: Admin views analytics dashboard for that date
THEN:
  ✓ Sales total matches sum of successful payments
  ✓ Inventory turnover calculated correctly
  ✓ Payment success rate accurate
  ✓ Revenue figures align with accounting system
```

### 8.4 Defect Resolution & Escalation

| Severity | Time to Fix | Escalation | Example |
|---|---|---|---|
| **Critical** | 2 hours | CTO, VP Eng | Payment processing down; inventory not updating |
| **High** | 1 day | Eng Manager, Product Manager | Performance degradation; data inconsistency |
| **Medium** | 3 days | Product Manager, Tech Lead | UI bug; minor incorrect calculations |
| **Low** | 1 sprint | Team Lead | Typo; cosmetic styling issues |

---

## 9. Estimation & Roadmap

### 9.1 High-Level Work Breakdown Structure (WBS)

```
PHT-Fashion E-Commerce Platform
│
├── 1. Project Management & Infrastructure
│   ├── 1.1 Project Setup & Team Onboarding (1 week)
│   ├── 1.2 CI/CD Pipeline Setup (2 weeks)
│   ├── 1.3 Monitoring & Logging Infrastructure (1 week)
│   └── 1.4 Security & Compliance Setup (1 week)
│
├── 2. Backend - Core Services
│   ├── 2.1 Authentication & Authorization (2 weeks)
│   ├── 2.2 Product Management Service (2 weeks)
│   ├── 2.3 Inventory Management Service (3 weeks) ⚠️ CRITICAL
│   ├── 2.4 Order Management Service (2 weeks)
│   └── 2.5 User Profile & Management (1 week)
│
├── 3. Payment & Financial Services
│   ├── 3.1 PayPal Integration (2 weeks) ⚠️ CRITICAL
│   ├── 3.2 VNPay Integration (2 weeks) ⚠️ CRITICAL
│   ├── 3.3 Payment Reconciliation System (2 weeks)
│   ├── 3.4 Refund & Chargeback Handling (1 week)
│   └── 3.5 PCI DSS Compliance (2 weeks)
│
├── 4. Frontend - User Interfaces
│   ├── 4.1 Auth Pages (Register, Login, Reset) (1 week)
│   ├── 4.2 Product Catalog & Search (2 weeks)
│   ├── 4.3 Shopping Cart & Checkout (2 weeks)
│   ├── 4.4 Order Tracking Dashboard (1 week)
│   ├── 4.5 Chat Interface (1 week)
│   └── 4.6 Admin Dashboard - Core (2 weeks)
│
├── 5. Admin Features
│   ├── 5.1 Product Management UI (2 weeks)
│   ├── 5.2 Inventory Management UI (2 weeks)
│   ├── 5.3 Order Management UI (1 week)
│   ├── 5.4 Analytics & Reporting (3 weeks)
│   ├── 5.5 User Management UI (1 week)
│   └── 5.6 Payment Reconciliation Dashboard (2 weeks)
│
├── 6. Real-Time Features
│   ├── 6.1 Chat System (Socket.IO) (2 weeks)
│   ├── 6.2 Real-time Notifications (1 week)
│   ├── 6.3 Inventory Live Updates (1 week)
│   └── 6.4 Order Status Streaming (1 week)
│
├── 7. Testing & QA
│   ├── 7.1 Unit Testing (ongoing - 10% effort)
│   ├── 7.2 Integration Testing (3 weeks)
│   ├── 7.3 UAT Coordination (2 weeks)
│   ├── 7.4 Load Testing (1 week)
│   └── 7.5 Security Testing (1 week)
│
├── 8. Deployment & Launch
│   ├── 8.1 Production Deployment Setup (1 week)
│   ├── 8.2 Data Migration (if applicable) (1 week)
│   ├── 8.3 Launch Coordination (1 week)
│   └── 8.4 Post-Launch Support (2 weeks)
│
└── 9. Documentation & Training
    ├── 9.1 Technical Documentation (2 weeks)
    ├── 9.2 API Documentation (Swagger) (1 week)
    ├── 9.3 Admin Training Materials (1 week)
    ├── 9.4 User Documentation (1 week)
    └── 9.5 Staff Training Sessions (1 week)
```

### 9.2 Effort Estimation by Component

| Component | Effort (Person-Days) | Duration (Calendar Weeks) | Risk Level | Notes |
|---|---|---|---|---|
| **Auth & Security** | 12 | 2 | Low | Well-established patterns |
| **Product Service** | 10 | 2 | Low | CRUD operations |
| **Inventory System** | 25 | 3 | **HIGH** | Complex state machine, transactions |
| **Payment Integration (PayPal)** | 15 | 2 | **HIGH** | External API dependency |
| **Payment Integration (VNPay)** | 15 | 2 | **HIGH** | External API dependency + Vietnam-specific |
| **Order Management** | 12 | 2 | Medium | Depends on Payment system |
| **Cart & Checkout** | 12 | 2 | Low | Standard e-commerce flow |
| **Chat System** | 12 | 2 | Medium | Socket.IO + message history |
| **Analytics Dashboard** | 18 | 2.5 | Medium | Data aggregation complexity |
| **Admin Panel** | 16 | 2 | Medium | Multiple feature sub-pages |
| **Testing & QA** | 20 | 3 | Medium | Across all components |
| **DevOps & Infrastructure** | 12 | 2 | Medium | CI/CD, monitoring, scaling |
| **Documentation** | 8 | 1.5 | Low | Automated tools available |
| **Buffer (20%)** | 35 | — | — | Risk contingency |
| **TOTAL** | 232 person-days ≈ **35-40 weeks** | 5-6 months | | **Assuming team of 6-8 engineers** |

### 9.3 Resource Allocation

| Role | Count | Allocation | Responsibilities |
|---|---|---|---|
| Project Manager | 1 | 100% | Planning, stakeholder management, risk mitigation |
| Technical Lead | 1 | 100% | Architecture, code review, decisions |
| Backend Engineers | 4 | 100% | Services, APIs, database |
| Frontend Engineers | 2 | 100% | UI/UX, state management |
| DevOps Engineer | 1 | 50% | Infrastructure, CI/CD, monitoring |
| QA Engineer | 1 | 100% | Testing, UAT coordination |
| Business Analyst | 1 | 50% | Requirements clarification, validation |
| **Total** | **11** | — | — |

**Burn Rate:** ~35-40 weeks ÷ 6 months = Full engagement required

### 9.4 Critical Path & Key Milestones

```
Week 1      Week 2-3     Week 4-5     Week 6-7     Week 8-9     Week 10-12
│           │            │            │            │            │
├─ Kickoff  ├─ Design    ├─ API Dev   ├─ Testing  ├─ UAT       ├─ Launch
├─ Setup    │ Approval   ├─ Frontend   ├─ QA       ├─ Fixes     ├─ Monitor
└─ Onboard  ├─ Payment   ├─ Inventory ├─ Security ├─ Docs      └─ Support
            │ Gateway    ├─ Order     └─ Perf     └─ Training
            │ Integration│ Mgmt
            └─ DB Schema └─ Admin UI
```

**Critical Path Items (No Slack):**
1. Payment Gateway Integration (PayPal & VNPay)
2. Inventory Reservation System
3. Order-Payment-Inventory Sync
4. Security & PCI DSS Compliance

### 9.5 Technical Walkthrough for Development Team

#### Session 1: Architecture & Payment System Design
- **Duration:** 2 hours
- **Attendees:** All engineers + Tech Lead
- **Agenda:**
  - System architecture overview
  - Database schema deep-dive (ERD explanation)
  - Payment flow walkthrough (happy path + failure scenarios)
  - API endpoint contracts (Swagger review)
  - Dependency management (PayPal SDK, VNPay SDK versions)

**Key Discussion Points:**
- How to handle payment retries without creating duplicate orders?
- Idempotency keys for payment API calls
- Webhook validation & security
- Error codes mapping between payment providers

#### Session 2: Inventory Management & Transactions
- **Duration:** 2.5 hours
- **Attendees:** Backend engineers, Tech Lead
- **Agenda:**
  - Inventory state machine (reservation → deduction → release)
  - MongoDB transactions & session management
  - Concurrent update handling (prevent race conditions)
  - Reservation expiry logic
  - Testing strategy for complex scenarios

**Demo Code:**
- Inventory reservation transaction
- Concurrent purchase scenario
- Rollback on payment failure

#### Session 3: Frontend State Management & Real-Time Updates
- **Duration:** 2 hours
- **Attendees:** Frontend engineers, Tech Lead
- **Agenda:**
  - Context API structure for Cart, Auth, Orders
  - Socket.IO subscription for real-time events
  - Optimistic UI updates (cart, order status)
  - Error handling & recovery
  - Performance optimization (lazy loading, code splitting)

**Key Discussion Points:**
- Redux vs. Context API (decision rationale)
- Handling network disconnections (reconnect logic)
- State synchronization on focus/visibility change

#### Session 4: Testing Strategy & QA Workflow
- **Duration:** 1.5 hours
- **Attendees:** QA team, Backend lead, Frontend lead
- **Agenda:**
  - Test pyramid: unit, integration, e2e
  - Critical path test scenarios (payment, inventory, order)
  - Automated test tooling (Jest, Cypress/Playwright)
  - Manual test cases & checklist
  - Load testing approach (k6 or Apache JMeter)

**Deliverable:**
- UAT test case document
- Regression test checklist

#### Session 5: Security & Compliance Review
- **Duration:** 1.5 hours
- **Attendees:** All engineers, Security lead
- **Agenda:**
  - PCI DSS Level 1 requirements
  - JWT token security (expiry, rotation)
  - Input validation & sanitization (Zod schemas)
  - Encrypted communication (HTTPS, TLS)
  - Authentication & authorization patterns
  - OWASP Top 10 mitigation

### 9.6 Development Phases & Release Plan

**Phase 1 - MVP (Weeks 1-5):**
- ✅ Core platform infrastructure
- ✅ Product catalog & search
- ✅ Basic payment integration (PayPal only)
- ✅ Inventory system (basic)
- ✅ Order management
- ✅ User authentication

**Phase 2 - Enhancement (Weeks 6-8):**
- ✅ VNPay payment integration
- ✅ Advanced inventory management
- ✅ Analytics dashboard
- ✅ Chat system
- ✅ Admin panel

**Phase 3 - Polish & Optimization (Weeks 9-10):**
- ✅ Performance optimization
- ✅ Security hardening
- ✅ UAT & bug fixes
- ✅ Documentation finalization

**Phase 4 - Launch & Monitoring (Weeks 11-12):**
- ✅ Production deployment
- ✅ Launch coordination
- ✅ Post-launch support
- ✅ Monitoring & alerting

### 9.7 Risk Management & Mitigation

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **Payment Gateway API Changes** | High | Medium | Early stabilization, dedicated integration tests, vendor comms |
| **Inventory Sync Failures** | High | Medium | Comprehensive transaction handling, reconciliation jobs, alerting |
| **Scope Creep** | High | High | Strict change control, frozen scope after Week 2, prioritized backlog |
| **Performance Under Load** | High | Medium | Load testing in Week 5, caching strategy (Redis), database optimization |
| **Security Vulnerabilities** | Critical | Medium | Security review in Week 4, penetration testing, OWASP compliance |
| **Third-party Dependency Outages** | Medium | Low | Fallback mechanisms, graceful degradation, redundancy where possible |
| **Resource Availability** | High | Low | Cross-training, documentation, clear handoff procedures |
| **Data Quality Issues** | Medium | Low | Data validation rules, sanitation, quality checks in migration |

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|---|---|
| **ACID** | Atomicity, Consistency, Isolation, Durability - database transaction properties |
| **Admin** | User with elevated privileges for system management |
| **API** | Application Programming Interface for system communication |
| **Idempotency** | Property where repeated operations produce same result as single operation |
| **JWT** | JSON Web Token for stateless authentication |
| **Micro-transaction** | Reservation of inventory before payment confirmation |
| **Reconciliation** | Matching of two separate records to ensure consistency |
| **Saga Pattern** | Distributed transaction pattern for multi-step workflows |
| **SKU** | Stock Keeping Unit - unique product identifier |
| **Socket.IO** | Real-time bidirectional communication library |
| **UAT** | User Acceptance Testing - end-user validation phase |
| **Webhook** | Callback mechanism for real-time event notifications |

### 10.2 References & Standards

- **PCI DSS Compliance:** [https://www.pcisecuritystandards.org/](https://www.pcisecuritystandards.org/)
- **OWASP Top 10:** [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
- **RESTful API Design:** [https://restfulapi.net/](https://restfulapi.net/)
- **MongoDB Best Practices:** [https://docs.mongodb.com/](https://docs.mongodb.com/)

### 10.3 Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Project Sponsor | ___________________ | ___________________ | __________ |
| Business Owner | ___________________ | ___________________ | __________ |
| Technical Lead | ___________________ | ___________________ | __________ |
| Product Manager | ___________________ | ___________________ | __________ |

---

**Document End**

*This Project Initiation Document is a living document and will be updated as the project progresses. All changes require stakeholder approval.*
