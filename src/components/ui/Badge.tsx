import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => (
  <span className={clsx('badge', variants[variant], className)}>
    {children}
  </span>
);

export const statusBadge = (status: string): React.ReactElement => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    processing: { variant: 'info', label: 'Processing' },
    shipped: { variant: 'purple', label: 'Shipped' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    suspended: { variant: 'danger', label: 'Suspended' },
    draft: { variant: 'neutral', label: 'Draft' },
    out_of_stock: { variant: 'danger', label: 'Out of Stock' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'danger', label: 'Rejected' },
    processed: { variant: 'info', label: 'Processed' },
    paid: { variant: 'success', label: 'Paid' },
    refunded: { variant: 'warning', label: 'Refunded' },
    credited: { variant: 'info', label: 'Credited' },
  };
  const cfg = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};
