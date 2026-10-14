# Admin Security & Access Control Checklist

## Security Best Practices for Store Administrators

- [x] **Strong Authentication**: Admin accounts must use strong, unique passwords ($\ge 12$ characters with letters, numbers, and symbols).
- [x] **Server-Side Token Verification**: Administrative operations (product CRUD, stock updates, order status changes) require authenticated Firebase Auth admin tokens.
- [x] **No Password Sharing**: Create separate admin login accounts for authorized store managers.
- [x] **Session Logout**: Always click **Logout** when accessing the admin panel on shared or shop devices.
- [x] **Zero Frontend Secret Storage**: Never store admin passwords or API keys in `localStorage` or frontend source code.
