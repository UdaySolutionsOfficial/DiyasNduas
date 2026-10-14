# Implementation Plan — Phase 9: Banners + Advanced Store Controls

Phase 9 equips Crackers King store administrators with advanced store controls: hero banner management with visual preview and desktop/mobile responsiveness, store announcement system, configurable featured product section titles, store operational toggles (Store Open/Closed & Accepting Orders On/Off), centralized contact information management, custom checkout instructions, and graceful customer-facing fallback behaviors.

## Scope & Architecture

### 1. Store Operational Toggles & Centralized Contact Info
- **Store Settings** (`StoreSettings`):
  - `isStoreOpen` (boolean): Controls whether store is open.
  - `acceptingOrders` (boolean): Controls whether order requests are accepted. If `false`, customers can browse catalog, cart, and wishlist, but checkout displays a clear store notice preventing order creation.
  - `whatsappNumber` & `contactPhone`: Centralized configuration consumed dynamically by WhatsApp deep links (`whatsapp.ts`).
  - `checkoutInstructions` & `orderConfirmationNote`: Configurable instructions displayed during checkout and order confirmation.
  - `featuredSectionTitle`: Custom title for the customer homepage featured section.

### 2. Announcement System (`Announcement`)
- **Firestore Collection**: `announcements`
- **Fields**: `id`, `text`, `type` (`'info' | 'festive' | 'warning' | 'success'`), `isActive`, `displayOrder`, `createdAt`, `updatedAt`.
- **Customer UI**: Integrated into `AnnouncementBar.tsx` on customer layout. If empty, collapses gracefully without layout gaps.

### 3. Hero Banner Management & Responsive Image Strategy (`Banner`)
- **Firestore Collection**: `banners`
- **Fields**: `id`, `title`, `subtitle`, `imageUrl`, `mobileImageUrl`, `buttonText`, `buttonUrl`, `displayOrder`, `isActive`.
- **Admin UI**: Visual live preview box in `BannerModal.tsx` showing desktop/mobile rendering before publishing.

### 4. Admin Store Controls Area
- Integrated into `AdminLayout.tsx` and `Dashboard.tsx` under a dedicated **Store Controls** navigation group (Banners, Announcements, Featured Products, Store Settings).

## Verification Plan

### Automated Verification
- Run `npm run build` in `C:\Users\DELL\.gemini\antigravity\scratch\crackers-king` to verify 0 TypeScript or bundler compilation errors.

### Manual Verification
- Test toggling `acceptingOrders = false` in Admin Settings and verify Checkout page shows friendly store notice blocking order submission.
- Test updating WhatsApp number in Admin Settings and verify customer WhatsApp buttons use updated number.
- Test Add/Edit Announcement and verify Top Announcement Bar updates live.
- Test Hero Banner live preview and mobile image support.
- Test changing Featured Section Title and verify customer homepage reflects title.
