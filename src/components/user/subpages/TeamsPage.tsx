import { ArrowLeft, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Props {
  onBack: () => void;
  onNavigateToInvite: () => void;
}

export const TeamsPage: React.FC<Props> = ({ onBack, onNavigateToInvite }) => {
  const { currentUser, users, deposits } = useApp();
  const [activeLevel, setActiveLevel] = useState<'1' | '2' | '3'>('1');

  // Find Level 1 referrals (referredBy === currentUser.inviteCode or currentUser.uid)
  const level1Users = users.filter(
    (u) =>
      currentUser &&
      (u.referredBy === currentUser.inviteCode || u.referredBy === currentUser.uid)
  );

  // Level 2 referrals (referred by level 1 users)
  const level1Codes = new Set(level1Users.flatMap((u) => [u.inviteCode, u.uid]));
  const level2Users = users.filter((u) => u.referredBy && level1Codes.has(u.referredBy));

  // Level 3 referrals
  const level2Codes = new Set(level2Users.flatMap((u) => [u.inviteCode, u.uid]));
  const level3Users = users.filter((u) => u.referredBy && level2Codes.has(u.referredBy));

  const currentLevelList =
    activeLevel === '1' ? level1Users : activeLevel === '2' ? level2Users : level3Users;

  // Calculate team total recharge & profit
  const allTeamUsers = [...level1Users, ...level2Users, ...level3Users];
  const teamRecharges = deposits
    .filter(
      (d) =>
        d.status === 'approved' &&
        allTeamUsers.some((u) => u.id === d.userId || u.uid === d.userUid)
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const teamCommission = allTeamUsers.reduce((acc, curr) => acc + (curr.todayCommission || 0), 0);

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Dark Red Gradient Header matching Screenshot_2026-06-07-12-45-27-98 */}
      <div className="bg-gradient-to-b from-[#8b0000] via-[#6d1316] to-[#4a0000] text-white px-4 pt-3 pb-6">
        {/* Top Bar */}
        <div className="flex items-center pb-4 border-b border-white/10">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-white hover:text-red-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center font-bold text-base pr-4">Teams</h1>
        </div>

        {/* Team Amount Big Display */}
        <div className="pt-4 pb-2">
          <span className="text-xs text-white/70 block">Team amount</span>
          <span className="text-3xl font-bold tracking-tight text-white">
            {teamRecharges.toFixed(2)}
          </span>
        </div>

        {/* 8 Stats Grid */}
        <div className="grid grid-cols-3 gap-y-3 gap-x-2 pt-3 text-center border-t border-white/10 text-xs">
          <div>
            <span className="text-sm font-bold block text-white">
              {(teamRecharges * 0.05).toFixed(2)}
            </span>
            <span className="text-[11px] text-white/70">Agent Profit</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-sm font-bold block text-white">
              {teamRecharges.toFixed(2)}
            </span>
            <span className="text-[11px] text-white/70">Total recharge</span>
          </div>
          <div>
            <span className="text-sm font-bold block text-white">0</span>
            <span className="text-[11px] text-white/70">Total withdraw</span>
          </div>

          <div>
            <span className="text-sm font-bold block text-white">
              {teamCommission.toFixed(2)}
            </span>
            <span className="text-[11px] text-white/70">Order commission</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-sm font-bold block text-white">{level1Users.length}</span>
            <span className="text-[11px] text-white/70">Newcomers</span>
          </div>
          <div>
            <span className="text-sm font-bold block text-white">0</span>
            <span className="text-[11px] text-white/70">Activities number</span>
          </div>

          <div>
            <span className="text-sm font-bold block text-white">
              {teamRecharges.toFixed(2)}
            </span>
            <span className="text-[11px] text-white/70">Team amount</span>
          </div>
          <div className="border-l border-white/10 col-span-2">
            <span className="text-sm font-bold block text-white">{allTeamUsers.length}</span>
            <span className="text-[11px] text-white/70">Team number</span>
          </div>
        </div>
      </div>

      {/* Level Tabs matching screenshot */}
      <div className="bg-white border-b border-slate-200 flex">
        {(['1', '2', '3'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setActiveLevel(lvl)}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
              activeLevel === lvl
                ? 'border-red-800 text-red-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Level {lvl}
          </button>
        ))}
      </div>

      {/* Member List */}
      <div className="p-4 flex-1">
        {currentLevelList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p>No data</p>
            <button
              onClick={onNavigateToInvite}
              className="mt-2 px-4 py-2 bg-red-800 text-white font-medium rounded-lg text-xs hover:bg-red-900 transition-colors"
            >
              Invite Friends to Earn Commission
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentLevelList.map((member) => (
              <div
                key={member.id}
                className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{member.username}</span>
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded-sm font-semibold">
                      VIP {member.vipLevel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    UID: {member.uid} · Joined: {member.createdAt.substring(0, 10)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 block">
                    {member.balance.toFixed(2)} USDT
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    +{member.todayCommission.toFixed(2)} comm
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
