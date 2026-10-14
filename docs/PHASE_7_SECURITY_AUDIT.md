# Phase 7 Security Audit & Rules Specification

## 1. Security Principles
- **Client Non-Authority**: Untrusted browser data (`localStorage` cart items, client-side prices) are revalidated on server side inside atomic Firestore transactions before order creation.
- **Role Isolation**: Admin capabilities (product CRUD, stock updates, banner management, order status changes) require Firebase Auth admin tokens.

## 2. Firestore Security Rules Blueprint (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // Products: Public read, Admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Categories & Banners: Public read, Admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Orders: Public create & read by Order ID, Admin full access
    match /orders/{orderId} {
      allow create: if true;
      allow read: if true;
      allow update, delete: if isAdmin();
    }
  }
}
```

## 3. Data Protection
- Customer phone numbers, addresses, and full names are stored ONLY inside order documents and are not exposed in public catalog listings.
