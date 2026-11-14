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

  // Navigation parameter handler for deposit page
  const handleNavigateToDeposit = (params?: DepositNavigationParams) => {
    setDepositNavParams(params || null);
    setActiveSubpage('deposit');
  };

  // FRESH VISIT / UNAUTHENTICATED REDIRECT GUARD:
  // If no user is authenticated, immediately display the Login/Registration portal.
  // When arriving via an invitation share link containing ?code=..., automatically activate Register mode.
  const isRegisterRequested =
    typeof window !== 'undefined' &&
    Boolean(
      new URLSearchParams(window.location.search).get('code') ||
      new URLSearchParams(window.location.search).get('inviteCode') ||
      new URLSearchParams(window.location.search).get('ref') ||
      window.location.hash.includes('code=') ||
      window.location.hash.includes('register') ||
      window.location.pathname.includes('register')
    );

  if (!currentUser) {
    return (
      <div className="relative flex-1 h-full w-full bg-gradient-to-b from-[#4a121e] via-[#380b16] to-[#25050e] select-none overflow-hidden font-sans">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          defaultMode={isRegisterRequested ? 'register' : 'login'}
        />
      </div>
    );
  }

  // Router for full-screen subpages (rendered on top while preserving mounted tab state)
  const renderSubpage = () => {
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
    return null;
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
      {/* Scrollable Main Viewport — Primary tabs stay mounted so Menu/Task session never resets on navigation */}
      <div className="flex-1 overflow-y-auto">
        {activeSubpage ? renderSubpage() : null}

        <div className={!activeSubpage && currentTab === 'home' ? 'h-full' : 'hidden'}>
          <HomeTab
            onNavigate={(page) => {
              if (page === 'service' || page === 'menu' || page === 'record' || page === 'mine') {
                setCurrentTab(page);
              } else if (page === 'deposit') {
                handleNavigateToDeposit();
              } else {
                setActiveSubpage(page);
              }
            }}
          />
        </div>

        <div className={!activeSubpage && currentTab === 'service' ? 'h-full' : 'hidden'}>
          <ServiceTab />
        </div>

        <div className={!activeSubpage && currentTab === 'menu' ? 'h-full' : 'hidden'}>
          <MenuTab
            onNavigateToRecord={() => setCurrentTab('record')}
            onNavigateToDeposit={handleNavigateToDeposit}
            onNavigateToWithdrawal={() => setActiveSubpage('withdrawal')}
            onNavigateToSupport={() => setCurrentTab('service')}
          />
        </div>

        <div className={!activeSubpage && currentTab === 'record' ? 'h-full' : 'hidden'}>
          <RecordTab onNavigateToDeposit={handleNavigateToDeposit} />
        </div>

        <div className={!activeSubpage && currentTab === 'mine' ? 'h-full' : 'hidden'}>
          <MineTab
            onNavigate={(page) => {
              if (page === 'service' || page === 'menu' || page === 'record' || page === 'home') {
                setCurrentTab(page);
              } else if (page === 'deposit') {
                handleNavigateToDeposit();
              } else {
                setActiveSubpage(page);
              }
            }}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
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
