# Production Data Backup & Disaster Recovery Guide

## 1. Backup Strategy
- **Firestore Managed Exports**:
  - Configure automated daily Firestore exports to a Google Cloud Storage (GCS) bucket:
    ```bash
    gcloud firestore export gs://[YOUR_BACKUP_BUCKET_NAME]
    ```
- **Realtime Database (RTDB) Automated Backups**:
  - Enable automated daily RTDB backups in the Firebase Console under **Realtime Database $\rightarrow$ Backups**.
- **Firebase Storage Assets**:
  - Maintain a local or GCS mirror of product and banner image assets.

## 2. Recovery Procedure
1. **Firestore Restoration**:
   - Restore database from GCS export bucket:
     ```bash
     gcloud firestore import gs://[YOUR_BACKUP_BUCKET_NAME]/[EXPORT_PREFIX]
     ```
2. **RTDB Restoration**:
   - Import JSON backup file via Firebase Console under **Realtime Database $\rightarrow$ Import JSON**.
