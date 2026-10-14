export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'super_admin' | 'store_manager';
  lastLoginAt?: number;
}
