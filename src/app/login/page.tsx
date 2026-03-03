'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Button, Input } from '@/components/ui';
import { Monitor, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <Monitor size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IT Infra Manager Pro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="admin@itinfra.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-1">Demo Credentials:</p>
            <p>Email: admin@itinfra.com</p>
            <p>Password: Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
