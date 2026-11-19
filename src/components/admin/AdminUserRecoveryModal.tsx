import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Layers,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UserCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CustomComboRule, GrabbedOrder, User } from '../../types';
import { getEligiblePlatformForBalance } from '../../utils/balanceValidation';
import {
  DEFAULT_CYCLE_COMBO_SCHEDULES,
  DEFAULT_VIP_COMBO_SCHEDULE,
  EffectiveComboRule,
  extractCustomOverridesToSave,
  generateHybridComboSchedule,
  getBaselineComboSchedule,
  resolveComboDollarAmounts,
} from '../../utils/comboGenerator';

interface Props {
  user: User;
  orders: GrabbedOrder[];
  onClose: () => void;
  onSaveRecovery: (params: {
    userId: string;
    balance: number;
    todayCommission: number;
    currentCycleTasks: number;
    cycleNumber: number;
    workPermission: boolean;
    isVipAccount: boolean;
    comboOrderStep: number;
    customCombos: CustomComboRule[];
    activeOrderAction: 'none' | 'update' | 'create' | 'clear';
    activeOrderData?: {
      orderId?: string;
      orderNo?: string;
      platform: 'Amazon' | 'Alibaba' | 'Aliexpress';
      vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3';
      orderAmount: number;
      commission: number;
      isComboOrder: boolean;
      comboStepNumber?: number;
      requiredBalance?: number;
      comboDepositPercent?: number;
      comboCommissionPercent?: number;
      requiredDepositDeficit?: number;
      expectedIncome?: number;
    };
  }) => Promise<{ success: boolean; message?: string }>;
  onRequestConfirm: (opts: {
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'success';
    onConfirm: () => Promise<void> | void;
  }) => void;
}

export const AdminUserRecoveryModal: React.FC<Props> = ({
  user,
  orders,
  onClose,
  onSaveRecovery,
  onRequestConfirm,
}) => {
  const existingIncomplete = useMemo(
    () =>
      orders.find(
        (o) =>
          o.status === 'incomplete' &&
          (o.userId === user.id || (o.userUid && String(o.userUid) === String(user.uid)))
      ) || null,
    [orders, user.id, user.uid]
  );

  const initialSchedule = useMemo(() => generateHybridComboSchedule(user), [user]);

  const initialPreset: '1' | '3' | '5' | 'custom' = useMemo(() => {
    if (user.customCombos && user.customCombos.length > 0) return 'custom';
    if (user.isVipAccount || user.isLockedAccount) return '5';
    return (user.cycleNumber || 1) >= 2 ? '3' : '1';
  }, [user]);

  const [balanceStr, setBalanceStr] = useState(String(Number((user.balance || 0).toFixed(2))));
  const [todayCommStr, setTodayCommStr] = useState(
    String(Number((user.todayCommission || 0).toFixed(4)))
  );
  const [completedOrderStr, setCompletedOrderStr] = useState(
    String(user.currentCycleTasks ?? 0)
  );
  const [cycleNumberStr, setCycleNumberStr] = useState(String(user.cycleNumber || 1));
  const [workPerm, setWorkPerm] = useState(user.workPermission === true);
  const [comboSetMode, setComboSetMode] = useState<'1' | '3' | '5' | 'custom'>(initialPreset);
  const [comboRules, setComboRules] = useState<EffectiveComboRule[]>(() =>
    initialSchedule.map((r) => ({ ...r }))
  );

  // Primary Combo Trigger & Amount helper synced to next/first combo rule
  const parsedBalance = Math.max(0, parseFloat(balanceStr) || 0);
  const parsedCompletedTasks = Math.max(0, Math.min(25, parseInt(completedOrderStr, 10) || 0));

  const primaryComboIdx = useMemo(() => {
    const upcoming = comboRules.findIndex((r) => r.stepNumber > parsedCompletedTasks);
    return upcoming >= 0 ? upcoming : 0;
  }, [comboRules, parsedCompletedTasks]);

  const primaryCombo = comboRules[primaryComboIdx] || {
    stepNumber: user.comboOrderStep || 14,
    requiredPercent: 36,
    commissionPercent: 20,
  };

  // Combo Total Order Amount (USDT)
  const [primaryComboAmountStr, setPrimaryComboAmountStr] = useState<string>(() => {
    if (existingIncomplete?.isComboOrder && (existingIncomplete.requiredBalance || existingIncomplete.orderAmount)) {
      return String(
        Number((existingIncomplete.requiredBalance || existingIncomplete.orderAmount).toFixed(2))
      );
    }
    const baseBal = Number(user.balance || 0);
    const resolved = resolveComboDollarAmounts(baseBal, primaryCombo);
    return String(Number(resolved.totalOrderAmount.toFixed(2)));
  });

  // Active Incomplete Order recovery controls
  const [activeOrderMode, setActiveOrderMode] = useState<'none' | 'update' | 'create' | 'clear'>(
    existingIncomplete ? 'update' : 'none'
  );
  const [activeOrderIsCombo, setActiveOrderIsCombo] = useState<boolean>(
    existingIncomplete ? Boolean(existingIncomplete.isComboOrder) : false
  );
  const [activeOrderPlatform, setActiveOrderPlatform] = useState<'Amazon' | 'Alibaba' | 'Aliexpress'>(
    existingIncomplete?.platform || 'Amazon'
  );
  const [activeOrderStepStr, setActiveOrderStepStr] = useState<string>(
    String(
      existingIncomplete?.comboStepNumber ||
        primaryCombo.stepNumber ||
        Math.min(25, (user.currentCycleTasks ?? 0) + 1)
    )
  );
  const [activeOrderAmountStr, setActiveOrderAmountStr] = useState<string>(
    String(Number((existingIncomplete?.orderAmount ?? Math.max(20, (user.balance || 0) * 0.65)).toFixed(2)))
  );
  const [activeOrderCommStr, setActiveOrderCommStr] = useState<string>(
    String(
      Number(
        (
          existingIncomplete?.commission ??
          Math.max(1, Number(((user.balance || 0) * 0.04).toFixed(2)))
        ).toFixed(4)
      )
    )
  );
  const [activeOrderRequiredBalStr, setActiveOrderRequiredBalStr] = useState<string>(
    String(
      Number(
        (
          existingIncomplete?.requiredBalance ??
          existingIncomplete?.orderAmount ??
          Math.max(parsedBalance, Number(primaryComboAmountStr) || parsedBalance)
        ).toFixed(2)
      )
    )
  );

  // Manual 6-Field Recovery & Override Grid state
  const [comboOrderAmountStr, setComboOrderAmountStr] = useState<string>(() => {
    if (existingIncomplete && existingIncomplete.orderAmount > 0) {
      return String(Number(existingIncomplete.orderAmount.toFixed(2)));
    }
    return primaryComboAmountStr;
  });

  const [comboDepositMoneyStr, setComboDepositMoneyStr] = useState<string>(() => {
    const baseBal = Number(user.balance || 0);
    if (existingIncomplete) {
      if (typeof existingIncomplete.requiredDepositDeficit === 'number') {
        return String(Number(Math.max(0, existingIncomplete.requiredDepositDeficit).toFixed(2)));
      }
      const reqBal = existingIncomplete.requiredBalance ?? existingIncomplete.orderAmount ?? baseBal;
      return String(Number(Math.max(0, reqBal - baseBal).toFixed(2)));
    }
    const estComboAmt = parseFloat(primaryComboAmountStr) || baseBal;
    return String(Number(Math.max(0, estComboAmt - baseBal).toFixed(2)));
  });

  const [overrideCommissionStr, setOverrideCommissionStr] = useState<string>(() => {
    if (existingIncomplete) {
      return String(Number((existingIncomplete.commission || 0).toFixed(4)));
    }
    return String(Number((user.todayCommission || 0).toFixed(4)));
  });

  const [expectedIncomeStr, setExpectedIncomeStr] = useState<string>(() => {
    if (existingIncomplete) {
      const exp =
        typeof existingIncomplete.expectedIncome === 'number' && existingIncomplete.expectedIncome > 0
          ? existingIncomplete.expectedIncome
          : (existingIncomplete.orderAmount || 0) + (existingIncomplete.commission || 0);
      return String(Number(exp.toFixed(4)));
    }
    const estAmt = parseFloat(primaryComboAmountStr) || 0;
    const estComm = Number(user.todayCommission || 0);
    return String(Number((estAmt + estComm).toFixed(4)));
  });

  const [overrideComboFieldsEdited, setOverrideComboFieldsEdited] = useState(false);
  const [overrideCommissionEdited, setOverrideCommissionEdited] = useState(false);
  const [overrideExpectedEdited, setOverrideExpectedEdited] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const eligibleTier = getEligiblePlatformForBalance(parsedBalance);

  const handleSelectComboPreset = (mode: '1' | '3' | '5' | 'custom') => {
    setComboSetMode(mode);
    const cycNum = Math.max(1, parseInt(cycleNumberStr, 10) || user.cycleNumber || 1);
    if (mode === '1') {
      const differsFromCycle = cycNum !== 1;
      const rule: EffectiveComboRule = {
        slotIndex: 0,
        stepNumber: 14,
        requiredPercent: 36,
        commissionPercent: 20,
        isAutoFallback: !differsFromCycle,
        isCustomOverride: differsFromCycle,
        sourceLabel: differsFromCycle ? 'Preset 1-Combo Override' : 'Default Cycle #1 Rule',
      };
      setComboRules([rule]);
      const nextAmtStr = String(Number((parsedBalance * 1.36).toFixed(2)));
      setPrimaryComboAmountStr(nextAmtStr);
      if (!overrideComboFieldsEdited) {
        setComboOrderAmountStr(nextAmtStr);
        setComboDepositMoneyStr(String(Number((parsedBalance * 0.36).toFixed(2))));
      }
    } else if (mode === '3') {
      const differsFromCycle = cycNum < 2;
      const rules: EffectiveComboRule[] = DEFAULT_CYCLE_COMBO_SCHEDULES[2].map((r, idx) => ({
        ...r,
        slotIndex: idx,
        isAutoFallback: !differsFromCycle,
        isCustomOverride: differsFromCycle,
        sourceLabel: differsFromCycle ? 'Preset 3-Combo Override' : 'Default Cycle #2 Rule',
      }));
      setComboRules(rules);
      const nextAmtStr = String(Number((parsedBalance * 1.55).toFixed(2)));
      setPrimaryComboAmountStr(nextAmtStr);
      if (!overrideComboFieldsEdited) {
        setComboOrderAmountStr(nextAmtStr);
        setComboDepositMoneyStr(String(Number((parsedBalance * 0.55).toFixed(2))));
      }
    } else if (mode === '5') {
      const rules: EffectiveComboRule[] = DEFAULT_VIP_COMBO_SCHEDULE.map((r, idx) => ({
        ...r,
        slotIndex: idx,
        isAutoFallback: true,
        isCustomOverride: false,
        sourceLabel: 'Default VIP Rule (5 Combos)',
      }));
      setComboRules(rules);
      const nextAmtStr = String(
        Number((parsedBalance * (1 + rules[0].requiredPercent / 100)).toFixed(2))
      );
      setPrimaryComboAmountStr(nextAmtStr);
      if (!overrideComboFieldsEdited) {
        setComboOrderAmountStr(nextAmtStr);
        setComboDepositMoneyStr(
          String(Number(((parsedBalance * rules[0].requiredPercent) / 100).toFixed(2)))
        );
      }
    }
  };

  const updatePrimaryComboTriggerStep = (newStep: number) => {
    const step = Math.max(1, Math.min(25, Math.round(newStep || 1)));
    setComboRules((prev) => {
      if (prev.length === 0) {
        return [{ slotIndex: 0, stepNumber: step, requiredPercent: 36, commissionPercent: 20, isCustomOverride: true, isAutoFallback: false, sourceLabel: 'Custom Admin Rule' }];
      }
      return prev.map((r, i) =>
        i === primaryComboIdx
          ? { ...r, stepNumber: step, isCustomOverride: true, isAutoFallback: false, sourceLabel: 'Custom Admin Rule' }
          : r
      );
    });
    if (activeOrderIsCombo) {
      setActiveOrderStepStr(String(step));
    }
  };

  const updatePrimaryComboAmount = (amountText: string) => {
    setPrimaryComboAmountStr(amountText);
    setComboOrderAmountStr(amountText);
    const amt = parseFloat(amountText);
    if (!isNaN(amt) && amt >= 0) {
      const exactDeposit = Math.max(0, Number((amt - parsedBalance).toFixed(2)));
      setComboDepositMoneyStr(String(exactDeposit));
      setComboRules((prev) => {
        if (prev.length === 0) {
          return [{ slotIndex: 0, stepNumber: primaryCombo.stepNumber || 14, requiredPercent: 36, commissionPercent: 20, customDepositAmount: exactDeposit, isCustomOverride: true, isAutoFallback: false, sourceLabel: `Fixed $${exactDeposit.toFixed(2)} Recharge` }];
        }
        return prev.map((r, i) =>
          i === primaryComboIdx
            ? {
                ...r,
                customDepositAmount: exactDeposit,
                customOrderAmount: undefined,
                isCustomOverride: true,
                isAutoFallback: false,
                sourceLabel: `Fixed $${exactDeposit.toFixed(2)} Recharge`,
              }
            : r
        );
      });
    }
    if (activeOrderIsCombo) {
      setActiveOrderRequiredBalStr(amountText);
      setActiveOrderAmountStr(amountText);
    }
    if (!overrideExpectedEdited && !isNaN(amt)) {
      const commVal = parseFloat(overrideCommissionStr) || 0;
      setExpectedIncomeStr(String(Number((amt + commVal).toFixed(4))));
    }
  };

  const handleOverrideBalanceChange = (val: string) => {
    setBalanceStr(val);
    const nextBal = Math.max(0, parseFloat(val) || 0);
    const nextDeficit = Math.max(0, parseFloat(comboDepositMoneyStr) || 0);
    if (overrideComboFieldsEdited || activeOrderIsCombo) {
      setActiveOrderRequiredBalStr(String(Number((nextBal + nextDeficit).toFixed(2))));
    }
  };

  const handleOverrideComboDepositChange = (val: string) => {
    setComboDepositMoneyStr(val);
    setOverrideComboFieldsEdited(true);
    const deficit = Math.max(0, parseFloat(val) || 0);
    const reqBalStr = String(Number((parsedBalance + deficit).toFixed(2)));
    setActiveOrderRequiredBalStr(reqBalStr);
    if (deficit > 0) {
      setActiveOrderIsCombo(true);
    }
  };

  const handleOverrideComboOrderAmountChange = (val: string) => {
    setOverrideComboFieldsEdited(true);
    updatePrimaryComboAmount(val);
    setActiveOrderAmountStr(val);
    const amt = parseFloat(val) || 0;
    if (!overrideExpectedEdited) {
      const commVal = parseFloat(overrideCommissionStr) || 0;
      setExpectedIncomeStr(String(Number((amt + commVal).toFixed(4))));
    }
  };

  const handleOverrideCommissionChange = (val: string) => {
    setOverrideCommissionStr(val);
    setOverrideCommissionEdited(true);
    setActiveOrderCommStr(val);
    if (activeOrderMode === 'none' && !overrideComboFieldsEdited) {
      setTodayCommStr(val);
    }
    if (!overrideExpectedEdited) {
      const ordAmt = parseFloat(comboOrderAmountStr) || 0;
      const commVal = parseFloat(val) || 0;
      setExpectedIncomeStr(String(Number((ordAmt + commVal).toFixed(4))));
    }
  };

  const handleOverrideExpectedIncomeChange = (val: string) => {
    setExpectedIncomeStr(val);
    setOverrideExpectedEdited(true);
    setOverrideComboFieldsEdited(true);
  };

  const handleSaveClick = () => {
    setFormError(null);
    const bal = parseFloat(balanceStr);
    const comm = parseFloat(todayCommStr);
    const completedTasks = parseInt(completedOrderStr, 10);
    const cycNum = parseInt(cycleNumberStr, 10);

    if (isNaN(bal) || bal < 0) {
      setFormError('Total Account Balance must be a non-negative number.');
      return;
    }
    if (isNaN(comm) || comm < 0) {
      setFormError("Today's Commission must be a non-negative number.");
      return;
    }
    if (isNaN(completedTasks) || completedTasks < 0 || completedTasks > 25) {
      setFormError('Current Completed Order Number must be between 0 and 25.');
      return;
    }
    if (isNaN(cycNum) || cycNum < 1) {
      setFormError('Cycle Number must be 1 or greater.');
      return;
    }

    const comboDepMoney = parseFloat(comboDepositMoneyStr);
    const comboOrdAmt = parseFloat(comboOrderAmountStr);
    const overrideComm = parseFloat(overrideCommissionStr);
    const overrideExpected = parseFloat(expectedIncomeStr);

    if (!isNaN(comboDepMoney) && comboDepMoney < 0) {
      setFormError('Combo Required Deposit / Shortage Money must be 0 or greater.');
      return;
    }
    if (!isNaN(overrideExpected) && overrideExpected < 0) {
      setFormError('Expected Income must be 0 or greater.');
      return;
    }

    const sanitizedRows = [...comboRules]
      .filter(
        (r) =>
          r.stepNumber >= 1 &&
          r.stepNumber <= 25 &&
          (r.requiredPercent >= 0 || typeof r.customDepositAmount === 'number') &&
          (r.commissionPercent > 0 || typeof r.customCommissionAmount === 'number')
      )
      .sort((a, b) => a.stepNumber - b.stepNumber);

    if (sanitizedRows.length === 0) {
      setFormError('At least one valid combo rule (Step 1–25, Deposit % >= 0, Commission % > 0) is required.');
      return;
    }

    const simulatedTargetUser: User = {
      ...user,
      cycleNumber: cycNum,
      isVipAccount: comboSetMode === '5' || (comboSetMode === 'custom' && user.isVipAccount === true),
    };
    const sanitizedRules = extractCustomOverridesToSave(sanitizedRows, simulatedTargetUser);

    const activeOrdAmt = parseFloat(activeOrderAmountStr);
    const activeOrdComm = parseFloat(activeOrderCommStr);
    const activeOrdStep = parseInt(activeOrderStepStr, 10) || (completedTasks + 1);
    const activeOrdReqBal = parseFloat(activeOrderRequiredBalStr);

    // If admin edited combo/order override values while activeOrderMode was 'none', auto-create/sync pending order
    const shouldCreateOrderFromOverrides =
      activeOrderMode === 'none' &&
      (overrideComboFieldsEdited ||
        (overrideCommissionEdited && !isNaN(comboDepMoney) && comboDepMoney > 0));
    const effectiveOrderAction: 'none' | 'update' | 'create' | 'clear' =
      shouldCreateOrderFromOverrides ? 'create' : activeOrderMode;

    const finalOrderAmount =
      overrideComboFieldsEdited && !isNaN(comboOrdAmt) && comboOrdAmt > 0
        ? comboOrdAmt
        : !isNaN(activeOrdAmt) && activeOrdAmt > 0
        ? activeOrdAmt
        : !isNaN(comboOrdAmt) && comboOrdAmt > 0
        ? comboOrdAmt
        : 0;

    if ((effectiveOrderAction === 'update' || effectiveOrderAction === 'create') && (isNaN(finalOrderAmount) || finalOrderAmount <= 0)) {
      setFormError('Combo Order Amount / Active Order Amount must be greater than 0 USDT.');
      return;
    }

    const finalOrderCommission =
      overrideCommissionEdited && !isNaN(overrideComm) && overrideComm >= 0
        ? overrideComm
        : !isNaN(activeOrdComm) && activeOrdComm >= 0
        ? activeOrdComm
        : !isNaN(overrideComm) && overrideComm >= 0
        ? overrideComm
        : 0;

    const cleanDeficit = !isNaN(comboDepMoney) ? Math.max(0, Number(comboDepMoney.toFixed(2))) : 0;
    const effectiveIsCombo =
      activeOrderIsCombo || (shouldCreateOrderFromOverrides && cleanDeficit > 0) || (overrideComboFieldsEdited && cleanDeficit > 0);

    const computedReqBal = effectiveIsCombo
      ? overrideComboFieldsEdited
        ? Number((bal + cleanDeficit).toFixed(2))
        : !isNaN(activeOrdReqBal) && activeOrdReqBal > 0
        ? Number(activeOrdReqBal.toFixed(2))
        : Number((bal + cleanDeficit).toFixed(2))
      : undefined;

    const finalExpectedIncome =
      !isNaN(overrideExpected) && overrideExpected > 0
        ? Number(overrideExpected.toFixed(4))
        : Number((finalOrderAmount + finalOrderCommission).toFixed(4));

    const vipTierForPlatform: 'VIP 1' | 'VIP 2' | 'VIP 3' =
      activeOrderPlatform === 'Aliexpress'
        ? 'VIP 3'
        : activeOrderPlatform === 'Alibaba'
        ? 'VIP 2'
        : 'VIP 1';

    const targetRule = sanitizedRows[primaryComboIdx] || sanitizedRows[0];
    const effectiveComboStep = targetRule?.stepNumber || 14;
    const isNextVip = comboSetMode === '5' || (comboSetMode === 'custom' && user.isVipAccount === true);

    const summaryLines = [
      `Balance: ${bal.toFixed(2)} USDT`,
      `Completed Orders: ${completedTasks}/25 (Cycle #${cycNum})`,
      `Combo Schedule: ${sanitizedRows.length} total (${sanitizedRules.length} custom override(s), Primary trigger #${effectiveComboStep})`,
      `Today's Commission: ${comm.toFixed(2)} USDT`,
      effectiveOrderAction === 'clear'
        ? 'Pending Order: Clear active pending order'
        : effectiveOrderAction === 'update' || effectiveOrderAction === 'create'
        ? `Pending Order: ${finalOrderAmount.toFixed(2)} USDT (${effectiveIsCombo ? `Combo, Shortage ${cleanDeficit.toFixed(2)} USDT` : 'Standard'}, Comm ${finalOrderCommission.toFixed(2)}, Expected ${finalExpectedIncome.toFixed(2)})`
        : 'Pending Order: Unchanged',
    ].join(' · ');

    onRequestConfirm({
      title: `Save Recovery Changes for ${user.username} (UID: ${user.uid})`,
      description: `Are you sure you want to apply these account and order recovery updates? ${summaryLines}`,
      confirmLabel: 'Confirm & Apply Changes',
      variant: 'warning',
      onConfirm: async () => {
        const res = await onSaveRecovery({
          userId: user.id,
          balance: bal,
          todayCommission: comm,
          currentCycleTasks: completedTasks,
          cycleNumber: cycNum,
          workPermission: workPerm,
          isVipAccount: isNextVip,
          comboOrderStep: effectiveComboStep,
          customCombos: sanitizedRules,
          activeOrderAction: effectiveOrderAction,
          activeOrderData:
            effectiveOrderAction === 'update' || effectiveOrderAction === 'create'
              ? {
                  orderId: existingIncomplete?.id,
                  orderNo: existingIncomplete?.orderNo,
                  platform: activeOrderPlatform,
                  vipTier: vipTierForPlatform,
                  orderAmount: Number(finalOrderAmount.toFixed(2)),
                  commission: Number(finalOrderCommission.toFixed(4)),
                  expectedIncome: finalExpectedIncome,
                  isComboOrder: effectiveIsCombo,
                  comboStepNumber: Math.max(1, Math.min(25, activeOrdStep)),
                  requiredBalance: computedReqBal,
                  comboDepositPercent: targetRule?.requiredPercent,
                  comboCommissionPercent: targetRule?.commissionPercent,
                  requiredDepositDeficit: effectiveIsCombo ? cleanDeficit : undefined,
                }
              : undefined,
        });
        if (res.success) {
          onClose();
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl || '/assets/aistudio/a3.f53cf407_cf3e68d0.png'}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Edit User State &amp; Order Details
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold">
                  UID: {user.uid}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Account: <strong className="text-white">{user.username}</strong> ·{' '}
                {eligibleTier ? (
                  <span className="text-emerald-400 font-semibold">
                    {eligibleTier.platform} ({eligibleTier.tier})
                  </span>
                ) : (
                  <span className="text-slate-400">VIP 0 (&lt;20 USDT)</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Editor Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {formError && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Manual Recovery & Override Inputs (2-Column Grid Layout) */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Manual Recovery &amp; Override Controls
              </span>
              <span className="text-[10px] text-slate-400">
                Direct account &amp; combo override (syncs immediately on Save)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Total Account Balance (USDT)
                  </label>
                  <input
                    type="number"
                    name="totalBalance"
                    step="any"
                    min="0"
                    value={balanceStr}
                    onChange={(e) => handleOverrideBalanceChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Combo Required Deposit / Shortage Money (USDT)
                  </label>
                  <input
                    type="number"
                    name="comboDepositMoney"
                    step="any"
                    min="0"
                    value={comboDepositMoneyStr}
                    onChange={(e) => handleOverrideComboDepositChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-rose-300 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Expected Income (USDT)
                  </label>
                  <input
                    type="number"
                    name="expectedIncome"
                    step="any"
                    min="0"
                    value={expectedIncomeStr}
                    onChange={(e) => handleOverrideExpectedIncomeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Combo Order Amount (USDT)
                  </label>
                  <input
                    type="number"
                    name="comboOrderAmount"
                    step="any"
                    min="0"
                    value={comboOrderAmountStr}
                    onChange={(e) => handleOverrideComboOrderAmountChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-cyan-300 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Commission (USDT)
                  </label>
                  <input
                    type="number"
                    name="commission"
                    step="any"
                    min="0"
                    value={overrideCommissionStr}
                    onChange={(e) => handleOverrideCommissionChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-200 block mb-1">
                    Order Number (0–25)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      name="orderNumber"
                      min="0"
                      max="25"
                      value={completedOrderStr}
                      onChange={(e) => setCompletedOrderStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-slate-400 font-mono font-bold shrink-0">/ 25</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Core Financial & Task Progress State Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Account Balance, Commission &amp; Order Progress
              </span>
              <button
                type="button"
                onClick={() => setWorkPerm((w) => !w)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                  workPerm
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950/80 text-rose-300 border-rose-700'
                }`}
              >
                {workPerm ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" /> Work Permission: GRANTED
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Work Permission: LOCKED
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Total Account Balance (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={balanceStr}
                  onChange={(e) => handleOverrideBalanceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Today&apos;s Commission (USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={todayCommStr}
                  onChange={(e) => setTodayCommStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Completed Order # (0–25)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={completedOrderStr}
                    onChange={(e) => setCompletedOrderStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-slate-400 font-mono font-bold shrink-0">/ 25</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Work Cycle #
                </label>
                <input
                  type="number"
                  min="1"
                  value={cycleNumberStr}
                  onChange={(e) => setCycleNumberStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-cyan-300 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Combo Set, Trigger Step & Combo Amount */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4 text-amber-400" />
                Combo Set, Trigger Step &amp; Combo Amount
              </span>
              <span className="text-[11px] text-amber-300 font-semibold">
                {comboRules.length} Combo Trigger{comboRules.length === 1 ? '' : 's'} Active
              </span>
            </div>

            {/* Combo Count / Preset Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Current Combo Set / Count
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { key: '1', label: '1 Combo (Cycle 1)' },
                    { key: '3', label: '3 Combos (Cycle 2+)' },
                    { key: '5', label: '5 Combos (VIP)' },
                    { key: 'custom', label: `Custom (${comboRules.length})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectComboPreset(item.key)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      comboSetMode === item.key
                        ? 'bg-amber-600 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Primary Combo Trigger Step & Amount Editors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 border border-amber-500/30 rounded-xl">
              <div>
                <label className="text-[11px] font-bold text-amber-300 block mb-1">
                  Combo Trigger Order Number (1–25)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={primaryCombo.stepNumber}
                  onChange={(e) => updatePrimaryComboTriggerStep(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Task step that triggers the active/next combo order
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-300 block mb-1">
                  Combo Amount (Total Required USDT)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={primaryComboAmountStr}
                  onChange={(e) => updatePrimaryComboAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-rose-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {typeof primaryCombo.customDepositAmount === 'number' ? (
                    <>
                      Fixed Recharge: +{primaryCombo.customDepositAmount.toFixed(2)} USDT (% bypassed)
                    </>
                  ) : (
                    <>
                      Deposit %: +{primaryCombo.requiredPercent}% (Deficit:{' '}
                      {Math.max(0, (parseFloat(primaryComboAmountStr) || 0) - parsedBalance).toFixed(2)}{' '}
                      USDT)
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Editable Combo Rules Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Combo Schedule Table (Per-Row Custom $ Override + Auto Default Siblings)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setComboSetMode('custom');
                    setComboRules((prev) => [
                      ...prev,
                      {
                        slotIndex: prev.reduce((max, r) => Math.max(max, r.slotIndex), -1) + 1,
                        stepNumber: Math.min(25, (prev[prev.length - 1]?.stepNumber || 10) + 3),
                        requiredPercent: 45,
                        commissionPercent: 20,
                        isCustomOverride: true,
                        isAutoFallback: false,
                        sourceLabel: 'Custom Admin Rule',
                      },
                    ]);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Trigger
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-2">Combo #</th>
                      <th className="py-2 px-2">Order #</th>
                      <th className="py-2 px-2 text-rose-300">Custom Deposit $</th>
                      <th className="py-2 px-2">Deposit %</th>
                      <th className="py-2 px-2">Comm %</th>
                      <th className="py-2 px-2 text-emerald-300">Custom Comm $</th>
                      <th className="py-2 px-2">Est. Order / Recharge</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                    {(() => {
                      const baseList = getBaselineComboSchedule({
                        ...user,
                        cycleNumber: parseInt(cycleNumberStr, 10) || user.cycleNumber || 1,
                        isVipAccount: comboSetMode === '5' || (comboSetMode === 'custom' && user.isVipAccount === true),
                      });
                      return comboRules.map((rule, idx) => {
                        const resolved = resolveComboDollarAmounts(parsedBalance, rule);
                        const isDone = rule.stepNumber <= parsedCompletedTasks;
                        const isBaseSlot = rule.slotIndex < baseList.length;
                        const customDepositInputValue =
                          typeof rule.customDepositAmount === 'number'
                            ? String(rule.customDepositAmount)
                            : typeof rule.customOrderAmount === 'number'
                            ? String(Math.max(0, Number((rule.customOrderAmount - parsedBalance).toFixed(2))))
                            : '';
                        return (
                          <tr key={idx} className={isDone ? 'opacity-60' : ''}>
                            <td className="py-2 px-2.5">
                              <div className="font-mono font-bold text-amber-400">Combo #{idx + 1}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {isDone && (
                                  <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                    DONE
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] px-1 rounded font-bold ${
                                    rule.isAutoFallback
                                      ? 'bg-cyan-950 text-cyan-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {rule.isAutoFallback ? 'Auto' : 'Custom'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                min="1"
                                max="25"
                                value={rule.stepNumber}
                                onChange={(e) => {
                                  const v = Math.max(1, Math.min(25, parseInt(e.target.value, 10) || 1));
                                  setComboSetMode('custom');
                                  setComboRules((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? { ...r, stepNumber: v, isCustomOverride: true, isAutoFallback: false, sourceLabel: 'Custom Admin Rule' }
                                        : r
                                    )
                                  );
                                }}
                                className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-bold"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={customDepositInputValue}
                                placeholder={`Auto (${resolved.deficit.toFixed(2)})`}
                                onChange={(e) => {
                                  const raw = e.target.value.trim();
                                  setComboSetMode('custom');
                                  if (!raw) {
                                    const baseRow = baseList.find((b) => b.slotIndex === rule.slotIndex);
                                    setComboRules((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const revertedReq = baseRow ? baseRow.requiredPercent : r.requiredPercent;
                                        const hasCommDollar = typeof r.customCommissionAmount === 'number';
                                        const matchesBase =
                                          Boolean(baseRow) &&
                                          !hasCommDollar &&
                                          r.stepNumber === baseRow!.stepNumber &&
                                          r.commissionPercent === baseRow!.commissionPercent;
                                        return {
                                          ...r,
                                          requiredPercent: revertedReq,
                                          customOrderAmount: undefined,
                                          customDepositAmount: undefined,
                                          isCustomOverride: !matchesBase,
                                          isAutoFallback: matchesBase,
                                          sourceLabel: matchesBase
                                            ? baseRow!.sourceLabel
                                            : 'Custom Admin Rule',
                                        };
                                      })
                                    );
                                    return;
                                  }
                                  const depDollar = Math.max(0, parseFloat(raw) || 0);
                                  setComboRules((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            customOrderAmount: undefined,
                                            customDepositAmount: depDollar,
                                            isCustomOverride: true,
                                            isAutoFallback: false,
                                            sourceLabel: `Fixed $${depDollar.toFixed(2)} Recharge`,
                                          }
                                        : r
                                    )
                                  );
                                }}
                                className="w-24 bg-slate-900 border border-rose-500/40 rounded px-2 py-1 text-rose-300 font-mono font-bold placeholder:text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={resolved.hasCustomDollar ? '' : rule.requiredPercent}
                                placeholder={resolved.hasCustomDollar ? 'Fixed $' : 'Auto %'}
                                onChange={(e) => {
                                  const v = Math.max(0, parseFloat(e.target.value) || 0);
                                  setComboSetMode('custom');
                                  setComboRules((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            requiredPercent: v,
                                            customOrderAmount: undefined,
                                            customDepositAmount: undefined,
                                            isCustomOverride: true,
                                            isAutoFallback: false,
                                            sourceLabel: 'Custom Admin Rule',
                                          }
                                        : r
                                    )
                                  );
                                }}
                                className="w-18 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-rose-300 font-mono font-bold placeholder:text-amber-400/70"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={resolved.hasCustomCommission ? '' : rule.commissionPercent}
                                placeholder={resolved.hasCustomCommission ? 'Fixed $' : 'Auto %'}
                                onChange={(e) => {
                                  const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                                  setComboSetMode('custom');
                                  setComboRules((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            commissionPercent: v,
                                            customCommissionAmount: undefined,
                                            isCustomOverride: true,
                                            isAutoFallback: false,
                                            sourceLabel: 'Custom Admin Rule',
                                          }
                                        : r
                                    )
                                  );
                                }}
                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-300 font-mono font-bold placeholder:text-amber-400/70"
                              />
                            </td>
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={
                                  typeof rule.customCommissionAmount === 'number'
                                    ? String(rule.customCommissionAmount)
                                    : ''
                                }
                                placeholder={`Auto (${resolved.commission.toFixed(2)})`}
                                onChange={(e) => {
                                  const raw = e.target.value.trim();
                                  setComboSetMode('custom');
                                  if (!raw) {
                                    const baseRow = baseList.find((b) => b.slotIndex === rule.slotIndex);
                                    setComboRules((prev) =>
                                      prev.map((r, i) => {
                                        if (i !== idx) return r;
                                        const revertedComm = baseRow ? baseRow.commissionPercent : r.commissionPercent;
                                        const hasOrdDollar =
                                          typeof r.customOrderAmount === 'number' ||
                                          typeof r.customDepositAmount === 'number';
                                        const matchesBase =
                                          Boolean(baseRow) &&
                                          !hasOrdDollar &&
                                          r.stepNumber === baseRow!.stepNumber &&
                                          r.requiredPercent === baseRow!.requiredPercent;
                                        return {
                                          ...r,
                                          commissionPercent: revertedComm,
                                          customCommissionAmount: undefined,
                                          isCustomOverride: !matchesBase,
                                          isAutoFallback: matchesBase,
                                          sourceLabel: matchesBase
                                            ? baseRow!.sourceLabel
                                            : 'Custom Admin Rule',
                                        };
                                      })
                                    );
                                    return;
                                  }
                                  const commDollar = Math.max(0, parseFloat(raw) || 0);
                                  setComboRules((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            customCommissionAmount: commDollar,
                                            isCustomOverride: true,
                                            isAutoFallback: false,
                                            sourceLabel: `Fixed $${commDollar.toFixed(2)} Comm`,
                                          }
                                        : r
                                    )
                                  );
                                }}
                                className="w-24 bg-slate-900 border border-emerald-500/40 rounded px-2 py-1 text-emerald-200 font-mono font-bold placeholder:text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-2.5 font-mono text-slate-300 whitespace-nowrap">
                              <div className="text-white font-bold">{resolved.totalOrderAmount.toFixed(2)} USDT</div>
                              <div className="text-[10px] text-rose-300">+{resolved.deficit.toFixed(2)} Recharge</div>
                            </td>
                            <td className="py-2 px-2.5 text-right whitespace-nowrap">
                              {isBaseSlot && (!rule.isAutoFallback || rule.isCustomOverride) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const baseRow = baseList.find((b) => b.slotIndex === rule.slotIndex);
                                    if (!baseRow) return;
                                    setComboRules((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...baseRow } : r))
                                    );
                                  }}
                                  title="Reset only this row back to automatic default"
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                                >
                                  <RotateCcw className="w-3 h-3" /> Auto
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={comboRules.length <= 1 || isBaseSlot}
                                  onClick={() => {
                                    setComboSetMode('custom');
                                    setComboRules((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  title={isBaseSlot ? 'Required baseline combo slot' : 'Remove extra trigger'}
                                  className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: Current Active Order Amount & Pending Order Recovery */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  Current Active Pending Order Details
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {existingIncomplete
                    ? `Active Incomplete Order #${existingIncomplete.orderNo} found`
                    : 'No active pending order on record — you can restore/attach one below'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {existingIncomplete ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveOrderMode('update')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        activeOrderMode === 'update'
                          ? 'bg-cyan-700 text-white border-cyan-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Edit Pending Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOrderMode('clear')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        activeOrderMode === 'clear'
                          ? 'bg-rose-700 text-white border-rose-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Clear Pending
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveOrderMode('none')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        activeOrderMode === 'none'
                          ? 'bg-slate-800 text-white border-slate-600'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      No Pending Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOrderMode('create')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer flex items-center gap-1 ${
                        activeOrderMode === 'create'
                          ? 'bg-cyan-700 text-white border-cyan-500'
                          : 'bg-slate-950 text-cyan-300 border-cyan-800/60'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" /> Restore Pending Order
                    </button>
                  </>
                )}
              </div>
            </div>

            {(activeOrderMode === 'update' || activeOrderMode === 'create') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Current Active Order Amount (USDT)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={activeOrderAmountStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveOrderAmountStr(val);
                      setComboOrderAmountStr(val);
                      setOverrideComboFieldsEdited(true);
                      if (!overrideExpectedEdited) {
                        const ord = parseFloat(val) || 0;
                        const commVal = parseFloat(overrideCommissionStr) || 0;
                        setExpectedIncomeStr(String(Number((ord + commVal).toFixed(4))));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Active Order Commission (USDT)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={activeOrderCommStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveOrderCommStr(val);
                      setOverrideCommissionStr(val);
                      setOverrideCommissionEdited(true);
                      if (!overrideExpectedEdited) {
                        const ord = parseFloat(comboOrderAmountStr) || 0;
                        const commVal = parseFloat(val) || 0;
                        setExpectedIncomeStr(String(Number((ord + commVal).toFixed(4))));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Platform Tier
                  </label>
                  <select
                    value={activeOrderPlatform}
                    onChange={(e) =>
                      setActiveOrderPlatform(
                        e.target.value as 'Amazon' | 'Alibaba' | 'Aliexpress'
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Amazon">Amazon (VIP 1)</option>
                    <option value="Alibaba">Alibaba (VIP 2)</option>
                    <option value="Aliexpress">Aliexpress (VIP 3)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Order Classification
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveOrderIsCombo((v) => !v)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeOrderIsCombo
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                        : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {activeOrderIsCombo ? 'Combo Order (Locked Deposit)' : 'Standard Order'}
                  </button>
                </div>

                {activeOrderIsCombo && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Active Combo Step #
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={activeOrderStepStr}
                        onChange={(e) => setActiveOrderStepStr(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Required Balance / Combo Target (USDT)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={activeOrderRequiredBalStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveOrderRequiredBalStr(val);
                          setOverrideComboFieldsEdited(true);
                          const req = parseFloat(val) || 0;
                          setComboDepositMoneyStr(String(Number(Math.max(0, req - parsedBalance).toFixed(2))));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-rose-300"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeOrderMode === 'clear' && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  The current active incomplete order will be cleared upon saving changes.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save &amp; Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
