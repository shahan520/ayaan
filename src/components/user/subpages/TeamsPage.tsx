import {
  ArrowLeft,
  ChevronRight,
  Share2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onBack: () => void;
  onNavigateToInvite: () => void;
}

export const TeamsPage: React.FC<Props> = ({ onBack, onNavigateToInvite }) => {
  const { currentUser, users, deposits, withdrawals } = useApp();
  const [activeLevel, setActiveLevel] = useState<'1' | '2' | '3'>('1');

  // 1. Level 1: Direct referrals registered using the user's invitation code or UID
  const level1Users = useMemo(() => {
    if (!currentUser) return [];
    return users.filter(
      (u) =>
        u.id !== currentUser.id &&
        (u.referredBy === currentUser.inviteCode || u.referredBy === currentUser.uid)
    );
  }, [currentUser, users]);

  // 2. Level 2: Secondary referrals registered using Level 1 members' invitation codes or UIDs
  const level2Users = useMemo(() => {
    if (level1Users.length === 0) return [];
    const l1Codes = new Set(level1Users.flatMap((u) => [u.inviteCode, u.uid].filter(Boolean)));
    return users.filter((u) => u.referredBy && l1Codes.has(u.referredBy));
  }, [level1Users, users]);

  // 3. Level 3: Tertiary referrals registered using Level 2 members' invitation codes or UIDs
  const level3Users = useMemo(() => {
    if (level2Users.length === 0) return [];
    const l2Codes = new Set(level2Users.flatMap((u) => [u.inviteCode, u.uid].filter(Boolean)));
    return users.filter((u) => u.referredBy && l2Codes.has(u.referredBy));
  }, [level2Users, users]);

  // All team members across 3 tiers
  const allTeamUsers = useMemo(
    () => [...level1Users, ...level2Users, ...level3Users],
    [level1Users, level2Users, level3Users]
  );

  // Helper to get total deposit for a user
  const getUserTotalDeposit = (userUid: string, userId: string, fallbackBalance: number) => {
    const userApprovedDeps = deposits
      .filter((d) => (d.userId === userId || d.userUid === userUid) && d.status === 'approved')
      .reduce((sum, d) => sum + d.amount, 0);
    return userApprovedDeps > 0 ? userApprovedDeps : fallbackBalance;
  };

  // Helper to get total withdrawal for a user
  const getUserTotalWithdrawal = (userUid: string, userId: string) => {
    return withdrawals
      .filter(
        (w) =>
          (w.userId === userId || w.userUid === userUid) &&
          (w.status === 'completed' || w.status === 'pending')
      )
      .reduce((sum, w) => sum + w.amount, 0);
  };

  // Helper to lookup inviter username from invite code or UID
  const getInviterName = (referredByCode?: string | null) => {
    if (!referredByCode) return 'System / Direct';
    const found = users.find(
      (u) => u.inviteCode === referredByCode || u.uid === referredByCode
    );
    return found ? found.username : referredByCode;
  };

  // Team calculations matching reference screenshots
  const level1Recharge = useMemo(
    () => level1Users.reduce((sum, u) => sum + getUserTotalDeposit(u.uid, u.id, u.balance), 0),
    [level1Users, deposits]
  );

  const level2Recharge = useMemo(
    () => level2Users.reduce((sum, u) => sum + getUserTotalDeposit(u.uid, u.id, u.balance), 0),
    [level2Users, deposits]
  );

  const level3Recharge = useMemo(
    () => level3Users.reduce((sum, u) => sum + getUserTotalDeposit(u.uid, u.id, u.balance), 0),
    [level3Users, deposits]
  );

  // Total Team Recharge across all levels
  const totalTeamRecharge = level1Recharge + level2Recharge + level3Recharge;

  // Agent Profit: 5% on Level 1 + 3% on Level 2 + 1% on Level 3
  const agentProfit =
    level1Recharge * 0.05 + level2Recharge * 0.03 + level3Recharge * 0.01;

  // Total Team Withdrawals
  const totalTeamWithdrawal = useMemo(() => {
    return withdrawals
      .filter(
        (w) =>
          w.status === 'completed' &&
          allTeamUsers.some((u) => u.id === w.userId || u.uid === w.userUid)
      )
      .reduce((sum, w) => sum + w.amount, 0);
  }, [withdrawals, allTeamUsers]);

  // Total Team Order Commissions
  const totalOrderCommission = useMemo(
    () => allTeamUsers.reduce((sum, u) => sum + (u.todayCommission || 0), 0),
    [allTeamUsers]
  );

  // Active Level List
  const currentList =
    activeLevel === '1' ? level1Users : activeLevel === '2' ? level2Users : level3Users;

  return (
    <div className="min-h-full bg-slate-100 flex flex-col font-sans select-none">
      {/* Dark Crimson / Wine Red Gradient Header matching Screenshot reference */}
      <div className="bg-gradient-to-b from-[#7a0a14] via-[#60050d] to-[#400207] text-white px-4 pt-3 pb-5 shadow-md">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-white hover:text-red-200 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-white tracking-wide">Teams</h1>
          <button
            onClick={onNavigateToInvite}
            className="text-xs text-white/90 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-colors cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            <span>Invite</span>
          </button>
        </div>

        {/* Team Amount Large Display */}
        <div className="pt-3 pb-3">
          <span className="text-xs text-red-100/80 block font-medium">Team amount</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {totalTeamRecharge.toFixed(2)}
            </span>
            <span className="text-xs text-red-200 font-semibold">USDT</span>
          </div>
        </div>

        {/* 8 Stats Grid matching exact screenshot layout */}
        <div className="grid grid-cols-3 gap-y-3 pt-3 border-t border-white/15 text-center">
          {/* Row 1 */}
          <div className="px-1">
            <span className="text-sm font-bold block text-white font-mono">
              {agentProfit.toFixed(2)}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Agent Profit</span>
          </div>
          <div className="px-1 border-x border-white/15">
            <span className="text-sm font-bold block text-white font-mono">
              {totalTeamRecharge.toFixed(2)}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Total recharge</span>
          </div>
          <div className="px-1">
            <span className="text-sm font-bold block text-white font-mono">
              {totalTeamWithdrawal === 0 ? '0' : totalTeamWithdrawal.toFixed(2)}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Total withdraw</span>
          </div>

          {/* Row 2 */}
          <div className="px-1">
            <span className="text-sm font-bold block text-white font-mono">
              {totalOrderCommission.toFixed(2)}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Order commission</span>
          </div>
          <div className="px-1 border-x border-white/15">
            <span className="text-sm font-bold block text-white font-mono">
              {level1Users.length}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Newcomers</span>
          </div>
          <div className="px-1">
            <span className="text-sm font-bold block text-white font-mono">0</span>
            <span className="text-[11px] text-red-100/80 font-medium">Activities number</span>
          </div>

          {/* Row 3 */}
          <div className="px-1">
            <span className="text-sm font-bold block text-white font-mono">
              {totalTeamRecharge.toFixed(2)}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Team amount</span>
          </div>
          <div className="px-1 border-l border-white/15 col-span-2 text-center">
            <span className="text-sm font-bold block text-white font-mono">
              {allTeamUsers.length}
            </span>
            <span className="text-[11px] text-red-100/80 font-medium">Team number</span>
          </div>
        </div>
      </div>

      {/* 3-Level Tab Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-2xs flex sticky top-0 z-10">
        <button
          onClick={() => setActiveLevel('1')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeLevel === '1'
              ? 'border-[#7a0a14] text-[#7a0a14]'
              : 'border-transparent text-slate-600 hover:text-black'
          }`}
        >
          <span>Level 1</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
              activeLevel === '1' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {level1Users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveLevel('2')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeLevel === '2'
              ? 'border-[#7a0a14] text-[#7a0a14]'
              : 'border-transparent text-slate-600 hover:text-black'
          }`}
        >
          <span>Level 2</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
              activeLevel === '2' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {level2Users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveLevel('3')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeLevel === '3'
              ? 'border-[#7a0a14] text-[#7a0a14]'
              : 'border-transparent text-slate-600 hover:text-black'
          }`}
        >
          <span>Level 3</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
              activeLevel === '3' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {level3Users.length}
          </span>
        </button>
      </div>

      {/* 1. LEVEL TAB DESCRIPTIONS (Exact required UI text) */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7a0a14]" />
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            {activeLevel === '1' && 'People who registered using your invite code'}
            {activeLevel === '2' && "People invited by your Level 1 members' invite codes"}
            {activeLevel === '3' && "People invited by your Level 2 members' invite codes"}
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
          {currentList.length} members
        </span>
      </div>

      {/* 2. MEMBER CARDS LIST */}
      <div className="p-4 flex-1">
        {currentList.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-xs space-y-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">No members in Level {activeLevel}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeLevel === '1'
                  ? 'Share your personal invitation code to invite new direct team members.'
                  : `Level ${activeLevel} members will automatically appear when your team invites friends.`}
              </p>
            </div>
            <button
              onClick={onNavigateToInvite}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7a0a14] hover:bg-[#5e070e] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite Friends to Earn Commission</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((member) => {
              const memberDeposit = getUserTotalDeposit(member.uid, member.id, member.balance);
              const memberWithdrawal = getUserTotalWithdrawal(member.uid, member.id);
              const inviterName = getInviterName(member.referredBy);

              return (
                <div
                  key={member.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex items-center justify-between"
                >
                  {/* Left Side: Avatar icon, Username, Join Date + Orange Invited By label */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 text-[#7a0a14] flex items-center justify-center shrink-0 shadow-2xs">
                      <User className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-[#000000]">
                          {member.username}
                        </span>
                        <span className="text-[9px] font-black bg-[#7a0a14] text-white px-1.5 py-0.2 rounded-xs tracking-tight">
                          VIP {member.vipLevel}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Joined {member.createdAt.substring(0, 10)}
                      </span>

                      {/* For Level 2 & Level 3 cards: Orange label showing who invited them */}
                      {activeLevel !== '1' && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold w-fit">
                          <span>Invited by: {inviterName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Green text (Total Deposit) & Orange/Yellow text (Total Withdraw) */}
                  <div className="text-right flex flex-col items-end gap-1 shrink-0 pl-2">
                    {/* Deposit - Green */}
                    <div className="flex items-center gap-1.5">
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 block font-mono leading-none">
                          {memberDeposit.toFixed(2)} USDT
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600/90 leading-tight">
                          Deposit
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Withdraw - Orange/Yellow */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-600 block font-mono leading-none">
                          {memberWithdrawal.toFixed(2)} USDT
                        </span>
                        <span className="text-[10px] font-bold text-amber-600/90 leading-tight">
                          Withdraw
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                        <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invitation Promotion Card at Bottom */}
        <div className="mt-5 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#7a0a14]" />
              <h4 className="font-black text-xs text-[#000000]">Your Referral Code</h4>
            </div>
            <p className="text-[11px] text-slate-600 font-mono font-bold tracking-wider">
              {currentUser?.inviteCode || currentUser?.uid}
            </p>
          </div>
          <button
            onClick={onNavigateToInvite}
            className="px-3 py-1.5 bg-[#7a0a14] hover:bg-[#5e070e] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Share Link</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
