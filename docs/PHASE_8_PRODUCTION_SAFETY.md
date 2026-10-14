# Phase 8 — Production Safety & Environment Strategy

## 1. Safety Principles
- **Zero Data Destruction**: No production or development database collections, documents, or Realtime Database nodes are reset, modified, or deleted during build/deploy steps.
- **Client Configuration Isolation**: Credentials and Firebase URLs are provided via environment variables (`.env`) and never hardcoded in component source files.

## 2. Implemented Collections & Paths Audit
- **Firestore Collections**:
  - `products` — Product catalog documents
  - `categories` — Category definitions
  - `banners` — Promotional homepage banners
  - `orders` — Authoritative customer order documents
  - `settings` — Store configuration defaults
- **Realtime Database (RTDB) Paths**:
  - `events/new_orders` — Realtime notification event stream for new orders
  - `notifications/latest_order` — Latest unacknowledged order payload for admin alerts
- **Firebase Storage Paths**:
  - `products/` — Product image uploads
  - `banners/` — Promotional banner image uploads

## 3. Environment Strategy
- **Development**: Local Vite dev server with fallback mock datasets when Firebase collections are unpopulated.
- **Staging / Production**: Client injects production Firebase credentials into environment variables during build (`npm run build`).
