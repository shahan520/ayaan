/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdminPanel } from './components/admin/AdminPanel';
import { Navbar } from './components/Navbar';
import { UserApp } from './components/user/UserApp';
import { AppProvider, useApp } from './context/AppContext';

const MainLayout: React.FC = () => {
  const { activeView, deviceFrame } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Top Controller Bar */}
      <Navbar />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeView === 'admin' ? (
          <div className="flex-1 overflow-y-auto">
            <AdminPanel />
          </div>
        ) : (
          /* User Mobile App View */
          <div className="flex-1 flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-0 sm:p-4 overflow-y-auto">
            {deviceFrame ? (
              /* Smartphone Bezel Mockup on desktop */
              <div className="relative my-auto w-full max-w-[412px] h-full sm:h-[844px] max-h-[100dvh] sm:max-h-[860px] bg-black sm:rounded-[44px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden sm:ring-1 sm:ring-slate-700">
                {/* iPhone Dynamic Island / Speaker Pill */}
                <div className="hidden sm:flex absolute top-2 inset-x-0 z-50 justify-center pointer-events-none">
                  <div className="h-4 w-28 bg-black rounded-full" />
                </div>

                {/* Smartphone Status Bar Mockup */}
                <div className="bg-[#8b0000] text-white/90 px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-tight z-40 select-none">
                  <span>12:45</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-mono">Vo LTE2</span>
                    <span>5G</span>
                    <div className="w-5 h-2.5 border border-white/80 rounded-xs p-0.5 flex items-center">
                      <div className="h-full w-4/5 bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Mobile App Canvas */}
                <div className="flex-1 overflow-hidden relative">
                  <UserApp />
                </div>

                {/* Home Indicator Bar */}
                <div className="hidden sm:flex h-4 bg-white justify-center items-center pointer-events-none pb-1">
                  <div className="w-32 h-1 bg-slate-400/80 rounded-full" />
                </div>
              </div>
            ) : (
              /* Full-width Responsive Canvas */
              <div className="w-full max-w-md h-full min-h-[700px] bg-white shadow-2xl flex flex-col overflow-hidden">
                <UserApp />
              </div>
            )}
          </div>
        )}
      </div>
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
