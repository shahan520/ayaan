import { Calendar, Headphones, Home, ShoppingBag, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthModal } from './auth/AuthModal';
import { DepositPage } from './subpages/DepositPage';
import { InvitePage } from './subpages/InvitePage';
import { RecordsPage } from './subpages/RecordsPage';
import { TeamsPage } from './subpages/TeamsPage';
import { WalletManagementPage } from './subpages/WalletManagementPage';
import { WithdrawalPage } from './subpages/WithdrawalPage';
import { HomeTab } from './tabs/HomeTab';
import { MenuTab } from './tabs/MenuTab';
import { MineTab } from './tabs/MineTab';
import { RecordTab } from './tabs/RecordTab';
import { ServiceTab } from './tabs/ServiceTab';

export const UserApp: React.FC = () => {
  const { currentUser } = useApp();
  const [currentTab, setCurrentTab] = useState<'home' | 'service' | 'menu' | 'record' | 'mine'>('mine');
  const [activeSubpage, setActiveSubpage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Router for subpages
  const renderContent = () => {
    if (activeSubpage === 'deposit') {
      return (
        <DepositPage
          onBack={() => setActiveSubpage(null)}
          onNavigateToRecords={() => setActiveSubpage('deposit-records')}
        />
      );
    }
    if (activeSubpage === 'withdrawal') {
      return (
        <WithdrawalPage
          onBack={() => setActiveSubpage(null)}
          onNavigateToWallet={() => setActiveSubpage('wallet')}
          onNavigateToRecords={() => setActiveSubpage('withdrawal-records')}
          onNavigateToMenu={() => {
            setActiveSubpage(null);
            setCurrentTab('menu');
          }}
        />
      );
    }
    if (activeSubpage === 'teams') {
      return (
        <TeamsPage
          onBack={() => setActiveSubpage(null)}
          onNavigateToInvite={() => setActiveSubpage('invite')}
        />
      );
    }
    if (activeSubpage === 'invite') {
      return <InvitePage onBack={() => setActiveSubpage(null)} />;
    }
    if (activeSubpage === 'wallet') {
      return <WalletManagementPage onBack={() => setActiveSubpage(null)} />;
    }
    if (activeSubpage === 'deposit-records') {
      return (
        <RecordsPage initialType="deposit" onBack={() => setActiveSubpage(null)} />
      );
    }
    if (activeSubpage === 'withdrawal-records') {
      return (
        <RecordsPage initialType="withdrawal" onBack={() => setActiveSubpage(null)} />
      );
    }

    // Default primary tabs
    switch (currentTab) {
      case 'home':
        return (
          <HomeTab
            onNavigate={(page) => {
              if (page === 'service' || page === 'menu' || page === 'record' || page === 'mine') {
                setCurrentTab(page);
              } else {
                setActiveSubpage(page);
              }
            }}
          />
        );
      case 'service':
        return <ServiceTab />;
      case 'menu':
        return (
          <MenuTab
            onNavigateToRecord={() => setCurrentTab('record')}
            onNavigateToDeposit={() => setActiveSubpage('deposit')}
          />
        );
      case 'record':
        return <RecordTab />;
      case 'mine':
      default:
        return (
          <MineTab
            onNavigate={(page) => {
              if (page === 'service' || page === 'menu' || page === 'record' || page === 'home') {
                setCurrentTab(page);
              } else {
                setActiveSubpage(page);
              }
            }}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        );
    }
  };

  const navItems = [
    { key: 'home' as const, label: 'Home', icon: Home },
    { key: 'service' as const, label: 'Service', icon: Headphones },
    { key: 'menu' as const, label: 'Menu', icon: ShoppingBag },
    { key: 'record' as const, label: 'Record', icon: Calendar },
    { key: 'mine' as const, label: 'Mine', icon: UserIcon },
  ];

  return (
    <div className="relative flex flex-col h-full bg-slate-100 select-none overflow-hidden font-sans">
      {/* Scrollable Main Viewport */}
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>

      {/* Fixed Bottom Navigation Bar matching Screenshot_2026-06-07-12-43-57-54 */}
      {!activeSubpage && (
        <div className="sticky bottom-0 z-40 bg-white border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
          <div className="grid grid-cols-5 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setCurrentTab(item.key)}
                  className="flex flex-col items-center justify-center py-1 transition-transform active:scale-95 group"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-amber-500 scale-105'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium mt-1 tracking-tight ${
                      isActive ? 'text-amber-500 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={showAuthModal || !currentUser}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />
    </div>
  );
};
