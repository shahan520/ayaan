import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Layers,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GrabbedOrder, User, UserMonitoringRecord } from '../../types';
import { getEligiblePlatformForBalance } from '../../utils/balanceValidation';
import { generateHybridComboSchedule } from '../../utils/comboGenerator';
import { connectMonitorWebSocket, fetchMonitoringRecords } from '../../utils/monitoringClient';

interface Props {
  users: User[];
  orders: GrabbedOrder[];
  onOnlineCountChange?: (count: number) => void;
  onSelectUserForRecovery?: (user: User) => void;
}

const formatExactTimestamp = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatRelativeAge = (iso: string | null | undefined): string => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

const shortenAddress = (addr: string | null | undefined): string => {
  if (!addr) return '';
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
};

export const AdminUserMonitoring: React.FC<Props> = ({
  users,
  orders,
  onOnlineCountChange,
  onSelectUserForRecovery,
}) => {
  const [monitorRecords, setMonitorRecords] = useState<Record<string, UserMonitoringRecord>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'online' | 'offline' | 'copied' | 'pending_order'
  >('all');
  const [, setTick] = useState(0);

  const loadMonitoringSnapshot = useCallback(async () => {
    try {
      const { records } = await fetchMonitoringRecords();
      const nextMap: Record<string, UserMonitoringRecord> = {};
      records.forEach((r) => {
        if (r?.userUid) {
          nextMap[String(r.userUid)] = r;
        }
      });
      setMonitorRecords(nextMap);
    } catch {
      // Absorb transient errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoringSnapshot();

    const disconnect = connectMonitorWebSocket({
      role: 'admin',
      onSnapshot: (records) => {
        const nextMap: Record<string, UserMonitoringRecord> = {};
        records.forEach((r) => {
          if (r?.userUid) {
            nextMap[String(r.userUid)] = r;
          }
        });
        setMonitorRecords(nextMap);
        setIsLoading(false);
      },
      onUpdate: (record) => {
        if (!record?.userUid) return;
        setMonitorRecords((prev) => ({
          ...prev,
          [String(record.userUid)]: record,
        }));
      },
      onConnectionChange: (connected) => {
        setWsConnected(connected);
      },
      onReconnect: () => {
        loadMonitoringSnapshot();
      },
    });

    // Periodic relative-time UI refresh every 15s (non-network)
    const tickTimer = setInterval(() => setTick((t) => t + 1), 15000);

    return () => {
      disconnect();
      clearInterval(tickTimer);
    };
  }, [loadMonitoringSnapshot]);

  // Build unified enriched monitoring rows combining registered users, active orders, and telemetry
  const enrichedRows = useMemo(() => {
    return users.map((user) => {
      const uid = String(user.uid);
      const telemetry: UserMonitoringRecord = monitorRecords[uid] || {
        userUid: uid,
        username: user.username,
        isOnline: false,
        lastActiveAt: null,
        lastLoginAt: null,
        lastIp: null,
        locationCountry: null,
        locationCity: null,
        locationRegion: null,
        lastCopiedTrc20At: null,
        lastCopiedTrc20Address: null,
        copyCount: 0,
        activePlatform: null,
      };

      const balance = Number(user.balance || 0);
      const eligibleTier = getEligiblePlatformForBalance(balance);

      const userIncompleteOrder = orders.find(
        (o) =>
          o.status === 'incomplete' &&
          (o.userId === user.id || (o.userUid && String(o.userUid) === uid))
      );

      const cycleTasks = user.currentCycleTasks ?? 0;
      const cycleNumber = user.cycleNumber || 1;
      const schedule = generateHybridComboSchedule(user);
      const nextComboIdx = schedule.findIndex((r) => r.stepNumber > cycleTasks);

      let comboStageLabel = '';
      let comboStageType: 'active_combo' | 'active_order' | 'upcoming' | 'completed' | 'cleared' = 'upcoming';
      let deficitAmount = 0;

      if (userIncompleteOrder) {
        if (userIncompleteOrder.isComboOrder) {
          const step = userIncompleteOrder.comboStepNumber || cycleTasks + 1;
          const idxInSchedule = schedule.findIndex((r) => r.stepNumber === step);
          const comboOrdinal = idxInSchedule >= 0 ? idxInSchedule + 1 : 1;
          comboStageLabel = `Active Combo #${comboOrdinal}/${schedule.length} (Task #${step})`;
          comboStageType = 'active_combo';
          if (
            typeof userIncompleteOrder.requiredBalance === 'number' &&
            userIncompleteOrder.requiredBalance > balance
          ) {
            deficitAmount = Number((userIncompleteOrder.requiredBalance - balance).toFixed(2));
          }
        } else {
          comboStageLabel = `Pending Order · Task #${cycleTasks + 1}/25 (${userIncompleteOrder.platform})`;
          comboStageType = 'active_order';
        }
      } else if (cycleTasks >= 25) {
        comboStageLabel = `Cycle #${cycleNumber} Complete (25/25)`;
        comboStageType = 'completed';
      } else if (nextComboIdx >= 0) {
        comboStageLabel = `Next Combo #${nextComboIdx + 1}/${schedule.length} at Task #${schedule[nextComboIdx].stepNumber}`;
        comboStageType = 'upcoming';
      } else {
        comboStageLabel = `All ${schedule.length}/${schedule.length} Combos Cleared`;
        comboStageType = 'cleared';
      }

      return {
        user,
        telemetry,
        balance,
        eligibleTier,
        userIncompleteOrder,
        cycleTasks,
        cycleNumber,
        schedule,
        comboStageLabel,
        comboStageType,
        deficitAmount,
      };
    });
  }, [users, orders, monitorRecords]);

  // Metrics for summary cards and tab badge
  const summaryStats = useMemo(() => {
    const total = enrichedRows.length;
    const online = enrichedRows.filter((r) => r.telemetry.isOnline).length;
    const copied = enrichedRows.filter((r) => Boolean(r.telemetry.lastCopiedTrc20At)).length;
    const activeOrders = enrichedRows.filter((r) => Boolean(r.userIncompleteOrder)).length;
    return { total, online, copied, activeOrders };
  }, [enrichedRows]);

  useEffect(() => {
    onOnlineCountChange?.(summaryStats.online);
  }, [summaryStats.online, onOnlineCountChange]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedRows
      .filter((row) => {
        if (statusFilter === 'online' && !row.telemetry.isOnline) return false;
        if (statusFilter === 'offline' && row.telemetry.isOnline) return false;
        if (statusFilter === 'copied' && !row.telemetry.lastCopiedTrc20At) return false;
        if (statusFilter === 'pending_order' && !row.userIncompleteOrder) return false;

        if (!q) return true;
        return (
          row.user.username.toLowerCase().includes(q) ||
          String(row.user.uid).toLowerCase().includes(q) ||
          (row.telemetry.locationCountry || '').toLowerCase().includes(q) ||
          (row.telemetry.locationCity || '').toLowerCase().includes(q) ||
          (row.telemetry.lastIp || '').toLowerCase().includes(q) ||
          (row.telemetry.lastCopiedTrc20Address || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.telemetry.isOnline !== b.telemetry.isOnline) {
          return a.telemetry.isOnline ? -1 : 1;
        }
        const aTime = a.telemetry.lastActiveAt || '';
        const bTime = b.telemetry.lastActiveAt || '';
        if (aTime !== bTime) return bTime.localeCompare(aTime);
        return b.balance - a.balance;
      });
  }, [enrichedRows, searchQuery, statusFilter]);

  return (
    <div className="space-y-5">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Tracked Users
            </span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {summaryStats.total}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Registered accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Live Online Now
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {summaryStats.online}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Active user sessions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              TRC-20 Address Copied
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
              {summaryStats.copied}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Users copied deposit wallet</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Copy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Active Pending Orders
            </span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
              {summaryStats.activeOrders}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Currently on order / combo stage</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Monitoring Table Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
        {/* Header & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Real-Time User Monitoring
              <span
                className={`ml-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  wsConnected
                    ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {wsConnected ? 'Live Stream' : 'Reconnecting'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live balances, VIP tiers, task & combo progression, TRC-20 copy timestamps, IP locations, and presence status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, UID, city, country, IP..."
                className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-64"
              />
            </div>

            <button
              type="button"
              onClick={loadMonitoringSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: `All Users (${summaryStats.total})` },
              { key: 'online', label: `Online Now (${summaryStats.online})` },
              { key: 'offline', label: `Offline (${summaryStats.total - summaryStats.online})` },
              { key: 'copied', label: `Copied TRC-20 (${summaryStats.copied})` },
              { key: 'pending_order', label: `Pending Order/Combo (${summaryStats.activeOrders})` },
            ] as const
          ).map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                statusFilter === pill.key
                  ? 'bg-red-700 text-white border-red-600'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Monitoring Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">User & Online Status</th>
                <th className="py-3 px-3">Balance & VIP Tier</th>
                <th className="py-3 px-3">Task & Combo Progress</th>
                <th className="py-3 px-3">TRC-20 Copy Log</th>
                <th className="py-3 px-3">Location & Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    {isLoading
                      ? 'Loading live user monitoring records...'
                      : 'No users match the current search or filter.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map(
                  ({
                    user,
                    telemetry,
                    balance,
                    eligibleTier,
                    cycleTasks,
                    cycleNumber,
                    comboStageLabel,
                    comboStageType,
                    deficitAmount,
                  }) => {
                    const progressPct = Math.min(100, Math.round((cycleTasks / 25) * 100));
                    const hasLocation =
                      telemetry.locationCountry || telemetry.locationCity;

                    return (
                      <tr
                        key={user.uid}
                        onClick={() => onSelectUserForRecovery?.(user)}
                        title="Click to Edit User State & Order Details"
                        className={`hover:bg-slate-900/70 transition-colors align-top ${
                          onSelectUserForRecovery ? 'cursor-pointer' : ''
                        }`}
                      >
                        {/* 1. User & Online Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-start gap-2.5">
                            <div className="relative shrink-0">
                              <img
                                src={user.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png'}
                                alt={user.username}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-800"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                  telemetry.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs hover:text-amber-300 underline decoration-slate-700 underline-offset-2">
                                  {user.username}
                                </span>
                                {user.isDemoAccount && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold">
                                    DEMO
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                UID: <span className="text-amber-300 font-bold">{user.uid}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                {telemetry.isOnline ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                                    <WifiOff className="w-2.5 h-2.5" />
                                    Offline
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">
                                  {telemetry.lastActiveAt
                                    ? formatRelativeAge(telemetry.lastActiveAt)
                                    : 'No activity'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Balance & VIP Tier */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono font-extrabold text-emerald-400 text-sm">
                            <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{balance.toFixed(2)} USDT</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {eligibleTier ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  eligibleTier.tier === 'VIP 3'
                                    ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                                    : eligibleTier.tier === 'VIP 2'
                                    ? 'bg-orange-950/70 text-orange-300 border-orange-700/60'
                                    : 'bg-blue-950/70 text-blue-300 border-blue-700/60'
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                {eligibleTier.platform} · {eligibleTier.tier}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-semibold">
                                Unqualified (&lt;20 USDT)
                              </span>
                            )}
                            {user.isVipAccount && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                VIP Flag
                              </span>
                            )}
                          </div>
                          {telemetry.activePlatform && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Active Desk:{' '}
                              <span className="text-slate-200 font-semibold">
                                {telemetry.activePlatform}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 3. Task & Combo Progress */}
                        <td className="py-3 px-3 min-w-[210px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-mono font-bold text-white">
                              {cycleTasks} / 25 Tasks
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Cycle #{cycleNumber}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                cycleTasks >= 25
                                  ? 'bg-emerald-500'
                                  : comboStageType === 'active_combo'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                comboStageType === 'active_combo'
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                  : comboStageType === 'active_order'
                                  ? 'bg-amber-950/70 text-amber-300 border-amber-700/70'
                                  : comboStageType === 'completed'
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                                  : 'bg-slate-900 text-slate-300 border-slate-700'
                              }`}
                            >
                              {comboStageLabel}
                            </span>
                            {deficitAmount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-200 border border-red-700/60 text-[10px] font-mono font-bold">
                                Short -{deficitAmount.toFixed(2)} USDT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px]">
                            {user.workPermission ? (
                              <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Work OK
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5 font-medium">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                            <span className="text-slate-500">
                              · Today: {user.todayOrdersCount ?? 0}
                            </span>
                          </div>
                        </td>

                        {/* 4. TRC-20 Address Copy Log */}
                        <td className="py-3 px-3 min-w-[190px]">
                          {telemetry.lastCopiedTrc20At ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 text-[10px] font-bold">
                                <Copy className="w-3 h-3 shrink-0" />
                                <span>
                                  Copied at:{' '}
                                  {new Date(telemetry.lastCopiedTrc20At).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {telemetry.copyCount > 1 && (
                                  <span className="text-emerald-200/80 font-mono">
                                    ({telemetry.copyCount}x)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{formatExactTimestamp(telemetry.lastCopiedTrc20At)}</span>
                              </div>
                              {telemetry.lastCopiedTrc20Address && (
                                <div
                                  className="text-[10px] font-mono text-amber-300/90"
                                  title={telemetry.lastCopiedTrc20Address}
                                >
                                  {shortenAddress(telemetry.lastCopiedTrc20Address)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-medium">
                              Not copied yet
                            </span>
                          )}
                        </td>

                        {/* 5. User Location & Session */}
                        <td className="py-3 px-3 min-w-[175px]">
                          {hasLocation ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-white font-semibold text-xs">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>
                                  {[telemetry.locationCity, telemetry.locationCountry]
                                    .filter(Boolean)
                                    .join(', ')}
                                </span>
                              </div>
                              {telemetry.lastIp && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                                  <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>{telemetry.lastIp}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">
                              Awaiting session location
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1.5">
                            Last active:{' '}
                            <span className="text-slate-300">
                              {telemetry.lastActiveAt
                                ? formatExactTimestamp(telemetry.lastActiveAt)
                                : '—'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
