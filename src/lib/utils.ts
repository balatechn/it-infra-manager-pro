import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getRenewalBadge(status: string | null): { class: string; label: string } {
  switch (status) {
    case 'Critical': return { class: 'badge-danger', label: 'Critical' };
    case 'Expiring Soon': return { class: 'badge-warning', label: 'Expiring Soon' };
    case 'Expired': return { class: 'badge-danger', label: 'Expired' };
    case 'Active': return { class: 'badge-success', label: 'Active' };
    default: return { class: 'badge-gray', label: status || 'N/A' };
  }
}

export function getPaymentBadge(status: string): { class: string; label: string } {
  switch (status) {
    case 'Paid': return { class: 'badge-success', label: 'Paid' };
    case 'Pending': return { class: 'badge-warning', label: 'Pending' };
    case 'Overdue': return { class: 'badge-danger', label: 'Overdue' };
    default: return { class: 'badge-gray', label: status };
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
