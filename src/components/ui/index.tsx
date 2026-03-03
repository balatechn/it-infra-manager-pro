'use client';
import React from 'react';
import { cn } from '@/lib/utils';

// ─── Card ───────────────────────────────────────────────
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ children, variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5 gap-1.5', md: 'text-sm px-4 py-2 gap-2', lg: 'text-base px-6 py-3 gap-2' };

  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
}

// ─── Input ──────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <input
        id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Select ─────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <select
        id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          className
        )}
        {...props}
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

// ─── Textarea ───────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <textarea id={id} rows={3} className={cn('w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', className)} {...props} />
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full mx-4', sizes[size], 'max-h-[90vh] overflow-y-auto animate-slide-in')}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────
export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray' }) {
  const cls = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'badge-gray',
  };
  return <span className={cn('badge', cls[variant])}>{children}</span>;
}

// ─── Stat Card ──────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export function StatCard({ title, value, icon, color = 'text-primary-600', subtitle }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50', color)}>{icon}</div>
      </div>
    </Card>
  );
}

// ─── Loading Spinner ────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={cn('border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin', s[size])} />
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────
export function EmptyState({ message = 'No data found', icon }: { message?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      {icon || <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
