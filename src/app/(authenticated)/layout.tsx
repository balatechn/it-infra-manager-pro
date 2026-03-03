'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="lg:ml-[260px] min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
