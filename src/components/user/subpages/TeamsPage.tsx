import {
  ArrowLeft,
  User,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onBack: () => void;
  onNavigateToInvite?: () => void;
}

export const TeamsPage: React.FC<Props> = ({ onBack }) => {
  const { currentUser, users, inviteCodes, deposits, withdrawals } = useApp();
  const [activeLevel, setActiveLevel] = useState<'1' | '2' | '3'>('1');

  const norm = (s?: string | null) => (s ? String(s).trim().toUpperCase() : '');

  // 1. Level 1: Direct referrals registered using User's invite code, UID, username, or ID
  const level1Users = useMemo(() => {
    if (!currentUser) return [];
    const myIdentifiers = new Set(
      [
        norm(currentUser.inviteCode),
        norm(currentUser.uid),
        norm(currentUser.username),
        norm(currentUser.id),
      ].filter(Boolean)
    );

    // Include any user invite codes registered for this user
    inviteCodes?.forEach((c) => {
      const creator = norm(c.createdBy);
      if (
        creator.includes(norm(currentUser.username)) ||
        creator.includes(norm(currentUser.uid)) ||
        norm(c.code) === norm(currentUser.inviteCode) ||
        norm(c.code) === norm(currentUser.uid)
      ) {
        myIdentifiers.add(norm(c.code));
      }
    });

    return users.filter((u) => {
      if (u.id === currentUser.id || norm(u.uid) === norm(currentUser.uid)) return false;
      const ref = norm(u.referredBy);
      return Boolean(ref && myIdentifiers.has(ref));
    });
  }, [currentUser, users, inviteCodes]);

  // 2. Level 2: Secondary referrals registered using Level 1 members' invite codes, UIDs, usernames, or IDs
  const level2Users = useMemo(() => {
    if (!currentUser || level1Users.length === 0) return [];
    const l1Ids = new Set(level1Users.map((u) => u.id));
    const l1Uids = new Set(level1Users.map((u) => norm(u.uid)));
    const l1Identifiers = new Set(
      level1Users
        .flatMap((u) => [norm(u.inviteCode), norm(u.uid), norm(u.username), norm(u.id)])
        .filter(Boolean)
    );

    inviteCodes?.forEach((c) => {
      const creator = norm(c.createdBy);
      if (
        level1Users.some(
          (l1) =>
            creator.includes(norm(l1.username)) ||
            creator.includes(norm(l1.uid)) ||
            norm(c.code) === norm(l1.inviteCode) ||
            norm(c.code) === norm(l1.uid)
        )
      ) {
        l1Identifiers.add(norm(c.code));
      }
    });

    return users.filter((u) => {
      if (u.id === currentUser.id || norm(u.uid) === norm(currentUser.uid)) return false;
      if (l1Ids.has(u.id) || l1Uids.has(norm(u.uid))) return false;
      const ref = norm(u.referredBy);
      return Boolean(ref && l1Identifiers.has(ref));
    });
  }, [currentUser, level1Users, users, inviteCodes]);

  // 3. Level 3: Tertiary referrals registered using Level 2 members' invite codes, UIDs, usernames, or IDs
  const level3Users = useMemo(() => {
    if (!currentUser || level2Users.length === 0) return [];
    const l1Ids = new Set(level1Users.map((u) => u.id));
    const l1Uids = new Set(level1Users.map((u) => norm(u.uid)));
    const l2Ids = new Set(level2Users.map((u) => u.id));
    const l2Uids = new Set(level2Users.map((u) => norm(u.uid)));
    const l2Identifiers = new Set(
      level2Users
        .flatMap((u) => [norm(u.inviteCode), norm(u.uid), norm(u.username), norm(u.id)])
        .filter(Boolean)
    );

    inviteCodes?.forEach((c) => {
      const creator = norm(c.createdBy);
      if (
        level2Users.some(
          (l2) =>
            creator.includes(norm(l2.username)) ||
            creator.includes(norm(l2.uid)) ||
            norm(c.code) === norm(l2.inviteCode) ||
            norm(c.code) === norm(l2.uid)
        )
      ) {
        l2Identifiers.add(norm(c.code));
      }
    });

    return users.filter((u) => {
      if (u.id === currentUser.id || norm(u.uid) === norm(currentUser.uid)) return false;
      if (
        l1Ids.has(u.id) ||
        l1Uids.has(norm(u.uid)) ||
        l2Ids.has(u.id) ||
        l2Uids.has(norm(u.uid))
      )
        return false;
      const ref = norm(u.referredBy);
      return Boolean(ref && l2Identifiers.has(ref));
    });
  }, [currentUser, level1Users, level2Users, users, inviteCodes]);

  // All team members across 3 tiers
  const allTeamUsers = useMemo(
    () => [...level1Users, ...level2Users, ...level3Users],
    [level1Users, level2Users, level3Users]
  );

  // Helper to get total deposit for a user
  const getUserTotalDeposit = (user: (typeof users)[0]) => {
    const userApprovedDeps = deposits
      .filter(
        (d) =>
          (d.userId === user.id ||
            d.userUid === user.uid ||
            (d.username && d.username.toLowerCase() === user.username.toLowerCase())) &&
          d.status === 'approved'
      )
      .reduce((sum, d) => sum + d.amount, 0);
    if (userApprovedDeps > 0) return userApprovedDeps;
    if (typeof user.totalDeposit === 'number') return user.totalDeposit;
    return user.balance > 0 ? user.balance : 0;
  };

  // Helper to get total withdrawal for a user
  const getUserTotalWithdrawal = (user: (typeof users)[0]) => {
    const userWithdraws = withdrawals
      .filter(
        (w) =>
          (w.userId === user.id ||
            w.userUid === user.uid ||
            (w.username && w.username.toLowerCase() === user.username.toLowerCase())) &&
          (w.status === 'completed' || w.status === 'approved' || w.status === 'pending')
      )
      .reduce((sum, w) => sum + w.amount, 0);
    if (userWithdraws > 0) return userWithdraws;
    if (typeof user.totalWithdrawal === 'number') return user.totalWithdrawal;
    return 0;
  };

  // Helper to lookup inviter username from invite code or UID
  const getInviterName = (referredByCode?: string | null) => {
    if (!referredByCode) return '';
    const target = norm(referredByCode);
    const found = users.find(
      (u) =>
        norm(u.inviteCode) === target ||
        norm(u.uid) === target ||
        norm(u.username) === target ||
        norm(u.id) === target
    );
    return found ? found.username : referredByCode;
  };

  // Team calculations matching reference screenshots
  const level1Recharge = useMemo(
    () => level1Users.reduce((sum, u) => sum + getUserTotalDeposit(u), 0),
    [level1Users, deposits]
  );

  const level2Recharge = useMemo(
    () => level2Users.reduce((sum, u) => sum + getUserTotalDeposit(u), 0),
    [level2Users, deposits]
  );

  const level3Recharge = useMemo(
    () => level3Users.reduce((sum, u) => sum + getUserTotalDeposit(u), 0),
    [level3Users, deposits]
  );

  // Total Team Recharge across all levels
  const totalTeamRecharge = level1Recharge + level2Recharge + level3Recharge;

  // Agent Profit: 0.00 in reference screenshot
  const agentProfit = 0.0;

  // Total Team Withdrawals
  const totalTeamWithdrawal = useMemo(() => {
    return allTeamUsers.reduce((sum, u) => sum + getUserTotalWithdrawal(u), 0);
  }, [allTeamUsers, withdrawals]);

  // Order Commissions
  const totalOrderCommission = 0.0;

  // Active Level List
  const currentList =
    activeLevel === '1' ? level1Users : activeLevel === '2' ? level2Users : level3Users;

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col font-sans select-none pb-12">
      {/* Dark Crimson / Maroon Header matching Screenshot reference */}
      <div className="bg-[#54121e] text-white px-4 pt-3 pb-3 shadow-md">
        {/* Top Header Bar matching screenshot: <  Team */}
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-white hover:text-white/80 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-white tracking-wide pr-4">Team</h1>
          <div className="w-5" />
        </div>

        {/* Team Amount Large Display */}
        <div className="pt-2 pb-3 text-center">
          <span className="text-xs text-white/70 block font-normal">Team amount</span>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
              {totalTeamRecharge.toFixed(2)}
            </span>
            <span className="text-xs text-white/90 font-medium">USDT</span>
          </div>
        </div>

        {/* 8 Stats Grid matching exact screenshot 4x2 layout */}
        <div className="grid grid-cols-4 border-t border-white/10 text-center">
          {/* Row 1 */}
          <div className="py-2.5 px-0.5 border-r border-b border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {agentProfit.toFixed(2)}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Agent Profit
            </span>
          </div>
          <div className="py-2.5 px-0.5 border-r border-b border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {totalTeamRecharge.toFixed(2)}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Total recharge
            </span>
          </div>
          <div className="py-2.5 px-0.5 border-r border-b border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {totalTeamWithdrawal.toFixed(2)}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Total withdraw
            </span>
          </div>
          <div className="py-2.5 px-0.5 border-b border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {totalOrderCommission.toFixed(2)}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Order commission
            </span>
          </div>

          {/* Row 2 */}
          <div className="py-2.5 px-0.5 border-r border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {allTeamUsers.length}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Newcomers
            </span>
          </div>
          <div className="py-2.5 px-0.5 border-r border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              0
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Activities number
            </span>
          </div>
          <div className="py-2.5 px-0.5 border-r border-white/10">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {totalTeamRecharge.toFixed(2)}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Team amount
            </span>
          </div>
          <div className="py-2.5 px-0.5">
            <span className="text-xs sm:text-sm font-bold text-white block font-sans">
              {allTeamUsers.length}
            </span>
            <span className="text-[10px] text-white/70 block mt-0.5 leading-tight font-normal">
              Team number
            </span>
          </div>
        </div>
      </div>

      {/* 3-Level Tab Navigation matching screenshots */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs flex sticky top-0 z-10">
        <button
          onClick={() => setActiveLevel('1')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center ${
            activeLevel === '1'
              ? 'border-[#f59e0b] text-[#f59e0b]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Level 1</span>
        </button>

        <button
          onClick={() => setActiveLevel('2')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center ${
            activeLevel === '2'
              ? 'border-[#f59e0b] text-[#f59e0b]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Level 2</span>
        </button>

        <button
          onClick={() => setActiveLevel('3')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center ${
            activeLevel === '3'
              ? 'border-[#f59e0b] text-[#f59e0b]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Level 3</span>
        </button>
      </div>

      {/* Level Description Subtitle matching exact screenshot text */}
      <div className="px-4 pt-3.5 pb-2">
        <span className="text-xs text-slate-400 font-normal">
          {activeLevel === '1' && 'People who registered using your invite code'}
          {activeLevel === '2' && "People invited by your Level 1 members' invite codes"}
          {activeLevel === '3' && "People invited by your Level 2 members' invite codes"}
        </span>
      </div>

      {/* Member Cards List matching screenshots */}
      <div className="px-3 py-1 flex-1 space-y-2.5">
        {currentList.map((member) => {
          const memberDeposit = getUserTotalDeposit(member);
          const memberWithdrawal = getUserTotalWithdrawal(member);
          const inviterUsername = getInviterName(member.referredBy);
          const joinDate = member.createdAt ? member.createdAt.substring(0, 10) : '2026-05-18';

          return (
            <div
              key={member.id}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between"
            >
              {/* Left Side: Warm Icon, Username, Join Date, and Invited By */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-50/90 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100/50">
                  <User className="w-5 h-5 text-amber-500 stroke-[1.6]" />
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-800 leading-tight">
                    {member.username}
                  </span>

                  <span className="text-xs text-slate-400 font-normal mt-0.5 leading-tight">
                    Joined {joinDate}
                  </span>

                  {/* For Level 2 & Level 3 cards: Orange "Invited by: [Username]" matching screenshots */}
                  {activeLevel !== '1' && (
                    <span className="text-xs text-amber-500 font-medium mt-1 leading-tight">
                      Invited by: {inviterUsername}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Green text (Deposit) & Amber text (Withdraw) without arrow badges */}
              <div className="text-right flex flex-col items-end gap-1 shrink-0 pl-2">
                {/* Deposit - Green */}
                <div className="text-right">
                  <span className="text-sm font-bold text-[#10b981] block font-sans leading-none">
                    {memberDeposit.toFixed(2)} USDT
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1 leading-none font-normal">
                    Deposit
                  </span>
                </div>

                {/* Withdraw - Amber / Orange */}
                <div className="text-right mt-0.5">
                  <span className="text-sm font-bold text-[#f59e0b] block font-sans leading-none">
                    {memberWithdrawal.toFixed(2)} USDT
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1 leading-none font-normal">
                    Withdraw
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

