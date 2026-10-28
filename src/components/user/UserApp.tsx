import { Calendar, Headphones, Home, ShoppingBag, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DepositNavigationParams } from '../../types';
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
  const { currentUser, t } = useApp();
  const [currentTab, setCurrentTab] = useState<'home' | 'service' | 'menu' | 'record' | 'mine'>('home');
  const [activeSubpage, setActiveSubpage] = useState<string | null>(null);
  const [depositNavParams, setDepositNavParams] = useState<DepositNavigationParams | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [menuKey, setMenuKey] = useState<number>(0);

  // Navigation parameter handler for deposit page
  const handleNavigateToDeposit = (params?: DepositNavigationParams) => {
    setDepositNavParams(params || null);
    setActiveSubpage('deposit');
  };

  // Router for subpages
  const renderContent = () => {
    if (activeSubpage === 'deposit') {
      return (
        <DepositPage
          onBack={() => {
            setDepositNavParams(null);
            setActiveSubpage(null);
          }}
          onNavigateToRecords={() => setActiveSubpage('deposit-records')}
          navigationParams={depositNavParams}
        />
      );
    }
    if (activeSubpage === 'withdrawal') {
      return (
        <WithdrawalPage
          onBack={() => setActiveSubpage(null)}
          onNavigateToWallet={() => setActiveSubpage('wallet')}
          onNavigateToRecords={() => setActiveSubpage('withdrawal-records')}
          onNavigateToDeposit={() => handleNavigateToDeposit()}
          onNavigateToService={() => {
            setActiveSubpage(null);
            setCurrentTab('service');
          }}
          onNavigateToMenu={() => {
            setActiveSubpage(null);
            setMenuKey((prev) => prev + 1);
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
                if (page === 'menu') {
                  setMenuKey((prev) => prev + 1);
                }
                setCurrentTab(page);
              } else if (page === 'deposit') {
                handleNavigateToDeposit();
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
            key={`menu-${menuKey}`}
            onNavigateToRecord={() => setCurrentTab('record')}
            onNavigateToDeposit={handleNavigateToDeposit}
            onNavigateToWithdrawal={() => setActiveSubpage('withdrawal')}
            onNavigateToSupport={() => setCurrentTab('service')}
          />
        );
      case 'record':
        return <RecordTab onNavigateToDeposit={handleNavigateToDeposit} />;
      case 'mine':
      default:
        return (
          <MineTab
            onNavigate={(page) => {
              if (page === 'service' || page === 'menu' || page === 'record' || page === 'home') {
                if (page === 'menu') {
                  setMenuKey((prev) => prev + 1);
                }
                setCurrentTab(page);
              } else if (page === 'deposit') {
                handleNavigateToDeposit();
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
    { key: 'home' as const, label: t('home'), icon: Home },
    { key: 'service' as const, label: t('service'), icon: Headphones },
    { key: 'menu' as const, label: t('menu'), icon: ShoppingBag },
    { key: 'record' as const, label: t('record'), icon: Calendar },
    { key: 'mine' as const, label: t('mine'), icon: UserIcon },
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
                  onClick={() => {
                    if (item.key === 'menu') {
                      setMenuKey((prev) => prev + 1);
                    }
                    setCurrentTab(item.key);
                  }}
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
