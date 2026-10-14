# Production Troubleshooting & Incident Guide

## Common Operational Issues & Resolution Steps

### 1. Products Not Appearing on Customer Homepage
- **Check**: Ensure products are set to `isActive: true` in Admin Panel.
- **Check**: Verify Firebase configuration in `.env` (`VITE_FIREBASE_PROJECT_ID`).

### 2. Admin Login Fails
- **Check**: Verify internet connectivity and Firebase Auth credentials.
- **Check**: Confirm admin user has been created in Firebase Authentication console.

### 3. WhatsApp Link Does Not Open
- **Check**: Verify customer phone number has 10 digits.
- **Check**: Browser popup blocker settings (provide fallback "Send Order on WhatsApp" button).

### 4. Printable Receipt Hides Content or Prints Extra Pages
- **Check**: Ensure standard A4 paper format is selected in browser print dialog.
- **Check**: Confirm CSS `@media print` rules in `theme.css` remain untouched.

### 5. Realtime Order Popup Does Not Appear
- **Check**: Verify Realtime Database URL in `.env` (`VITE_FIREBASE_DATABASE_URL`).
- **Check**: Ensure RTDB security rules allow event subscription.
