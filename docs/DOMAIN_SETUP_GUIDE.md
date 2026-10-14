# Domain Setup & Production Hosting Guide

## 1. Firebase Hosting Deployment
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Authenticate and initialize hosting:
   ```bash
   firebase login
   firebase init hosting
   ```
   - Select public folder: `dist`
   - Configure as single-page app (SPA): `Yes`
3. Deploy build output:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## 2. Custom Domain Configuration (DNS)
1. Go to Firebase Console $\rightarrow$ **Hosting** $\rightarrow$ **Add Custom Domain** (e.g. `crackersking.com`).
2. Add the required A records provided by Firebase Console to your domain registrar DNS settings:
   - `A` record pointing `@` to Firebase IP addresses.
   - `CNAME` record for `www` pointing to `firebaseapp.com`.
3. Firebase automatically provisions free SSL/TLS certificates for HTTPS.
