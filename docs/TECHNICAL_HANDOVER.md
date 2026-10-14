# Technical Handover Specification

## 1. Project Architecture
- **Framework**: React 18 + TypeScript + Vite + Tailwind CSS
- **Routing**: React Router v6 SPA (`src/router.tsx`)
- **Backend Services**: Firebase Firestore, Realtime Database (RTDB), Firebase Auth, Firebase Storage (`src/firebase/config.ts`)

## 2. Directory Map
```
src/
├── admin/                 # Admin pages, modals, layout, and RTDB popup
├── components/            # UI Primitives & ErrorBoundary / 404 views
├── config/                # Environment variables & store defaults
├── constants/             # Application routes
├── contexts/              # Cart, Wishlist, Theme, Toast, Auth contexts
├── customer/              # Customer layouts, home, products, cart, checkout, tracking
├── firebase/              # Firebase SDK initialization
├── services/              # Products, Categories, Banners, Orders, RTDB event services
├── styles/                # Tailwind & theme.css with print media rules
├── types/                 # TypeScript interfaces
└── utils/                 # Formatters, LocalStorage, Order ID generator, WhatsApp deep-link
```

## 3. Build & Deployment
- Build Command: `npm run build`
- Output Directory: `dist/`
- Environment File: `.env`
