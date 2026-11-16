/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdminLoginGate } from './components/admin/AdminLoginGate';
import { AdminPanel } from './components/admin/AdminPanel';
import { UserApp } from './components/user/UserApp';
import { AppProvider, useApp } from './context/AppContext';

const MainLayout: React.FC = () => {
  const { activeView, isAdminAuthenticated, navigateToUser } = useApp();

  // SECURE ADMIN ROUTE VIEW (/admin or #admin)
  if (activeView === 'admin') {
    // Route Protection: If unauthenticated, show the secure Admin Login Gate
    if (!isAdminAuthenticated) {
      return (
        <AdminLoginGate
          onSuccess={() => {}}
          onCancel={navigateToUser}
        />
      );
    }

    // Authenticated: Render Enterprise Desktop Admin Console
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
        <AdminPanel />
      </div>
    );
  }

  // PUBLIC REGULAR USER VIEW:
  // Full-page responsive layout across Desktop, Laptop, Tablet, and Mobile
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden">
      <UserApp />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
