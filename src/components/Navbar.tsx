import {
  Laptop,
  RotateCcw,
  Shield,
  Smartphone,
  UserCheck,
} from 'lucide-react';
import React from 'react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    deviceFrame,
    setDeviceFrame,
    currentUser,
    users,
    switchUser,
    deposits,
    withdrawals,
    resetAllData,
  } = useApp();

  const pendingDeposits = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length;
  const totalPending = pendingDeposits + pendingWithdrawals;

  return (
    <nav className="bg-slate-950 text-slate-100 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 z-40 select-none">
      {/* Brand Zone: 1 text element */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/a3.f53cf407_cf3e68d0.png"
            alt="Logo"
            className="w-7 h-7 object-contain"
          />
          <span className="font-extrabold text-white text-sm tracking-tight whitespace-nowrap">
            TradeWeb QuDaizi
          </span>
        </div>
      </div>

      {/* Middle Zone: View Mode Switcher */}
      <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveView('user')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeView === 'user'
              ? 'bg-[#8b0000] text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>User Mobile App</span>
        </button>

        <button
          onClick={() => setActiveView('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
            activeView === 'admin'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4 text-red-500" />
          <span>Admin Panel</span>
          {totalPending > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              {totalPending}
            </span>
          )}
        </button>
      </div>

      {/* Right Zone: Bezel toggle & Demo switcher */}
      <div className="flex items-center gap-2.5">
        {activeView === 'user' && (
          <button
            onClick={() => setDeviceFrame(!deviceFrame)}
            title={deviceFrame ? 'Switch to Full Width Canvas' : 'Switch to Smartphone Bezel Frame'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {deviceFrame ? <Laptop className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium">
              {deviceFrame ? 'Desktop Canvas' : 'Phone Frame'}
            </span>
          </button>
        )}

        {/* User Switcher */}
        {activeView === 'user' && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentUser?.id || ''}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-hidden font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.username} (UID: {u.uid}) · VIP {u.vipLevel}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Data Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset all demo users, deposits, and invite codes to fresh seed data?')) {
              resetAllData();
            }
          }}
          title="Reset to initial seed data"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};
