import React from 'react';
import { CustomerInfo } from '../../types/order';
import { Input } from '../../components/ui/Input';
import { User, Phone, MapPin, FileText } from 'lucide-react';

export interface CheckoutFormProps {
  customerInfo: CustomerInfo;
  onChange: (info: CustomerInfo) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  customerInfo,
  onChange,
  errors,
  disabled = false,
}) => {
  const handleChange = (field: keyof CustomerInfo, value: string) => {
    onChange({
      ...customerInfo,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
          Customer Contact & Delivery Details
        </h3>
      </div>

      {/* Full Name */}
      <Input
        label="Full Name *"
        placeholder="Enter your full name"
        value={customerInfo.fullName}
        onChange={(e) => handleChange('fullName', e.target.value)}
        error={errors.fullName}
        leftIcon={<User className="w-4 h-4" />}
        disabled={disabled}
      />

      {/* Mobile Number */}
      <Input
        label="Mobile Phone Number *"
        placeholder="e.g. 9876543210"
        value={customerInfo.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        error={errors.phone}
        helperText="Required for order confirmation call & WhatsApp instructions."
        leftIcon={<Phone className="w-4 h-4" />}
        disabled={disabled}
      />

      {/* Delivery / Local Address */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Delivery / Local Address *
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
          <textarea
            rows={3}
            disabled={disabled}
            value={customerInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Door / House No., Street, Locality, City / Town"
            className={`w-full text-sm rounded-xl border bg-white dark:bg-slate-900 pl-10 pr-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
              errors.address
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
                : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-brand-500/20 text-slate-900 dark:text-slate-100'
            }`}
          />
        </div>
        {errors.address && <p className="text-xs text-rose-500 font-medium">{errors.address}</p>}
      </div>

      {/* Additional Note */}
      <Input
        label="Special Delivery Note (Optional)"
        placeholder="e.g. Preferred contact time, nearest landmark"
        value={customerInfo.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        leftIcon={<FileText className="w-4 h-4" />}
        disabled={disabled}
      />
    </div>
  );
};
