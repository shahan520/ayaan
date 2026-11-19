import { CustomComboRule, User } from '../types';

/**
 * Canonical 5-combo schedule for VIP and locked accounts (5 combos per 25-task cycle)
 * Task #8: 267% deposit deficit, 81% commission
 * Task #15: 150% deposit deficit, 81% commission
 * Task #19: 130% deposit deficit, 81% commission
 * Task #23: 90% deposit deficit, 81% commission
 * Task #25: 43% deposit deficit, 83% commission
 */
export const DEFAULT_VIP_COMBO_SCHEDULE: CustomComboRule[] = [
  { stepNumber: 8, requiredPercent: 267, commissionPercent: 81 },
  { stepNumber: 15, requiredPercent: 150, commissionPercent: 81 },
  { stepNumber: 19, requiredPercent: 130, commissionPercent: 81 },
  { stepNumber: 23, requiredPercent: 90, commissionPercent: 81 },
  { stepNumber: 25, requiredPercent: 43, commissionPercent: 83 },
];

/**
 * 6-Combo preset schedule across the 25 tasks (Tasks #5, #9, #13, #17, #21, #25)
 */
export const PRESET_6_COMBO_SCHEDULE: CustomComboRule[] = [
  { stepNumber: 5, requiredPercent: 40, commissionPercent: 20 },
  { stepNumber: 9, requiredPercent: 45, commissionPercent: 20 },
  { stepNumber: 13, requiredPercent: 50, commissionPercent: 25 },
  { stepNumber: 17, requiredPercent: 60, commissionPercent: 25 },
  { stepNumber: 21, requiredPercent: 70, commissionPercent: 30 },
  { stepNumber: 25, requiredPercent: 80, commissionPercent: 35 },
];

/**
 * 7-Combo preset schedule across the 25 tasks (Tasks #4, #8, #12, #15, #18, #22, #25)
 */
export const PRESET_7_COMBO_SCHEDULE: CustomComboRule[] = [
  { stepNumber: 4, requiredPercent: 35, commissionPercent: 18 },
  { stepNumber: 8, requiredPercent: 40, commissionPercent: 20 },
  { stepNumber: 12, requiredPercent: 45, commissionPercent: 22 },
  { stepNumber: 15, requiredPercent: 50, commissionPercent: 25 },
  { stepNumber: 18, requiredPercent: 60, commissionPercent: 25 },
  { stepNumber: 22, requiredPercent: 70, commissionPercent: 30 },
  { stepNumber: 25, requiredPercent: 80, commissionPercent: 35 },
];

/**
 * Default standard cycle combo schedules:
 * - Cycle 1: Exactly 1 combo at Task #14 (or #15) (36% deposit, 20% commission)
 * - Cycle 2 & Onwards: Exactly 3 combos at Task #7 (55%/26%), Task #15 (50%/18%), Task #23 (50%/18%)
 * - VIP / Locked Accounts: Exactly 5 combos (#8, #15, #19, #23, #25)
 */
export const DEFAULT_CYCLE_COMBO_SCHEDULES: Record<number, CustomComboRule[]> = {
  1: [{ stepNumber: 14, requiredPercent: 36, commissionPercent: 20 }],
  2: [
    { stepNumber: 7, requiredPercent: 55, commissionPercent: 26 },
    { stepNumber: 15, requiredPercent: 50, commissionPercent: 18 },
    { stepNumber: 23, requiredPercent: 50, commissionPercent: 18 },
  ],
};

export interface EffectiveComboRule extends CustomComboRule {
  slotIndex: number;
  isAutoFallback: boolean;
  sourceLabel: string;
}

export const TARGET_CYCLE_COMBO_COUNT = 5;

export const DEFAULT_DEMO_COMBO_SCHEDULE: CustomComboRule[] = [
  { stepNumber: 9, requiredPercent: 45, commissionPercent: 24, customDepositAmount: 135, customCommissionAmount: 105 },
  { stepNumber: 14, requiredPercent: 50, commissionPercent: 30, customDepositAmount: 220, customCommissionAmount: 225 },
  { stepNumber: 19, requiredPercent: 40, commissionPercent: 22, customDepositAmount: 260, customCommissionAmount: 200 },
  { stepNumber: 24, requiredPercent: 35, commissionPercent: 20, customDepositAmount: 420 },
];

/**
 * Returns the full baseline combo schedule expected for this user's cycle/VIP/Demo tier:
 * - Demo Account: 4 combos (#9, #14, #19, #24)
 * - VIP or Locked Account: 5 combos (#8, #15, #19, #23, #25)
 * - Standard Cycle 2+: 3 combos (#7, #15, #23)
 * - Standard Cycle 1: 1 combo (#14 or #15)
 */
export function getBaselineComboSchedule(user: User): EffectiveComboRule[] {
  if (user.isDemoAccount) {
    return DEFAULT_DEMO_COMBO_SCHEDULE.map((r, idx) => ({
      ...r,
      slotIndex: idx,
      isAutoFallback: true,
      isCustomOverride: false,
      sourceLabel: 'Default Demo Rule (4 Combos)',
    }));
  }

  if (user.isVipAccount || user.isLockedAccount) {
    return DEFAULT_VIP_COMBO_SCHEDULE.map((r, idx) => ({
      ...r,
      slotIndex: idx,
      isAutoFallback: true,
      isCustomOverride: false,
      sourceLabel: 'Default VIP Rule (5 Combos)',
    }));
  }

  const cycle = user.cycleNumber || 1;
  const cycleSchedule =
    cycle === 1 ? DEFAULT_CYCLE_COMBO_SCHEDULES[1] : DEFAULT_CYCLE_COMBO_SCHEDULES[2];

  return cycleSchedule.map((r, idx) => {
    const step =
      cycle === 1 && (user.comboOrderStep === 14 || user.comboOrderStep === 15)
        ? user.comboOrderStep
        : r.stepNumber;
    return {
      slotIndex: idx,
      stepNumber: step,
      requiredPercent: r.requiredPercent,
      commissionPercent: r.commissionPercent,
      isAutoFallback: true,
      isCustomOverride: false,
      sourceLabel: `Default Cycle #${cycle} Rule`,
    };
  });
}

function buildCustomSourceLabel(rule: CustomComboRule): string {
  if (typeof rule.customDepositAmount === 'number' && rule.customDepositAmount >= 0) {
    return `Fixed $${rule.customDepositAmount.toFixed(2)} Recharge`;
  }
  if (typeof rule.customOrderAmount === 'number' && rule.customOrderAmount > 0) {
    return `Fixed $${rule.customOrderAmount.toFixed(2)} Order`;
  }
  return 'Custom Admin Rule';
}

/**
 * HYBRID COMBO SCHEDULE RESOLVER:
 * - Always starts from the user's full baseline schedule (1 for Cycle 1, 3 for Cycle 2+, 5 for VIP/Locked, 4 for Demo).
 * - Merges Admin custom overrides per slot (by slotIndex, stepNumber, or nearest unclaimed slot).
 * - Unedited slots ALWAYS stay active with isAutoFallback: true so editing Combo #1 never drops Combo #2/#3/#4/#5!
 * - Extra custom triggers beyond baseline count (e.g., 6 or 7 combo presets) are appended cleanly.
 */
export function generateHybridComboSchedule(
  user: User,
  overrideCustomCombos?: CustomComboRule[]
): EffectiveComboRule[] {
  const baseline = getBaselineComboSchedule(user);
  const rawCustom =
    overrideCustomCombos !== undefined ? overrideCustomCombos : user.customCombos || [];
  const activeCustom = rawCustom.filter(
    (c) => c && typeof c.stepNumber === 'number' && c.isCustomOverride !== false
  );

  if (activeCustom.length === 0) {
    return baseline;
  }

  const merged: EffectiveComboRule[] = baseline.map((b) => ({ ...b }));
  const claimedBaselineIndices = new Set<number>();
  const matchedCustomIndices = new Set<number>();

  const toEffectiveCustom = (c: CustomComboRule, slotIdx: number): EffectiveComboRule => ({
    slotIndex: slotIdx,
    stepNumber: c.stepNumber,
    requiredPercent: c.requiredPercent,
    commissionPercent: c.commissionPercent,
    customOrderAmount:
      typeof c.customOrderAmount === 'number' && c.customOrderAmount > 0
        ? c.customOrderAmount
        : undefined,
    customDepositAmount:
      typeof c.customDepositAmount === 'number' && c.customDepositAmount >= 0
        ? c.customDepositAmount
        : undefined,
    customCommissionAmount:
      typeof c.customCommissionAmount === 'number' && c.customCommissionAmount >= 0
        ? c.customCommissionAmount
        : undefined,
    isCustomOverride: true,
    isAutoFallback: false,
    sourceLabel: buildCustomSourceLabel(c),
  });

  // Pass 1: Exact slotIndex matches within baseline range
  activeCustom.forEach((c, idx) => {
    if (
      typeof c.slotIndex === 'number' &&
      c.slotIndex >= 0 &&
      c.slotIndex < baseline.length &&
      !claimedBaselineIndices.has(c.slotIndex)
    ) {
      merged[c.slotIndex] = toEffectiveCustom(c, c.slotIndex);
      claimedBaselineIndices.add(c.slotIndex);
      matchedCustomIndices.add(idx);
    }
  });

  // Pass 2: Exact stepNumber matches for legacy rules without slotIndex
  activeCustom.forEach((c, idx) => {
    if (matchedCustomIndices.has(idx)) return;
    const matchIdx = baseline.findIndex(
      (b, bIdx) => !claimedBaselineIndices.has(bIdx) && b.stepNumber === c.stepNumber
    );
    if (matchIdx >= 0) {
      merged[matchIdx] = toEffectiveCustom(c, matchIdx);
      claimedBaselineIndices.add(matchIdx);
      matchedCustomIndices.add(idx);
    }
  });

  // Pass 3: Map remaining custom rules to closest unclaimed baseline slot, or append as extra slot
  activeCustom.forEach((c, idx) => {
    if (matchedCustomIndices.has(idx)) return;
    let bestIdx = -1;
    let bestDist = Infinity;
    baseline.forEach((b, bIdx) => {
      if (!claimedBaselineIndices.has(bIdx)) {
        const dist = Math.abs(b.stepNumber - c.stepNumber);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = bIdx;
        }
      }
    });

    if (bestIdx >= 0) {
      merged[bestIdx] = toEffectiveCustom(c, bestIdx);
      claimedBaselineIndices.add(bestIdx);
      matchedCustomIndices.add(idx);
    } else {
      merged.push(toEffectiveCustom(c, merged.length));
      matchedCustomIndices.add(idx);
    }
  });

  return merged.sort((a, b) => a.stepNumber - b.stepNumber);
}

/**
 * Computes effective deficit, total order amount, deposit %, commission, and commission %
 * for any combo rule (supporting Custom Order $, Custom Deposit $, Custom Commission $, or Auto %).
 */
export function resolveComboDollarAmounts(
  balance: number,
  rule: Pick<
    CustomComboRule,
    | 'requiredPercent'
    | 'commissionPercent'
    | 'customOrderAmount'
    | 'customDepositAmount'
    | 'customCommissionAmount'
  >
): {
  deficit: number;
  totalOrderAmount: number;
  depositPercent: number;
  commission: number;
  commissionPercent: number;
  hasCustomDollar: boolean;
  hasCustomCommission: boolean;
} {
  const safeBal = Math.max(0, Number(balance || 0));
  let deficit = 0;
  let totalOrderAmount = safeBal;
  let depositPercent = Number(rule.requiredPercent || 0);
  let hasCustomDollar = false;

  if (typeof rule.customDepositAmount === 'number' && rule.customDepositAmount >= 0) {
    // Exact fixed recharge/deposit override: bypass DEPOSIT % multiplication completely
    deficit = Number(rule.customDepositAmount.toFixed(2));
    totalOrderAmount = Number((safeBal + deficit).toFixed(2));
    depositPercent = 0;
    hasCustomDollar = true;
  } else if (typeof rule.customOrderAmount === 'number' && rule.customOrderAmount > 0) {
    // Legacy fixed order amount override
    totalOrderAmount = Number(rule.customOrderAmount.toFixed(2));
    deficit = Number(Math.max(0, totalOrderAmount - safeBal).toFixed(2));
    depositPercent = 0;
    hasCustomDollar = true;
  } else {
    deficit = Number(((safeBal * depositPercent) / 100).toFixed(2));
    totalOrderAmount = Number((safeBal + deficit).toFixed(2));
  }

  let commission = 0;
  let commissionPercent = Number(rule.commissionPercent || 0);
  const hasCustomCommission =
    typeof rule.customCommissionAmount === 'number' && rule.customCommissionAmount >= 0;

  if (hasCustomCommission && typeof rule.customCommissionAmount === 'number') {
    // Exact fixed commission override: bypass COMM % multiplication completely
    commission = Number(rule.customCommissionAmount.toFixed(4));
    commissionPercent = 0;
  } else {
    commission = Number(((totalOrderAmount * commissionPercent) / 100).toFixed(4));
  }

  return {
    deficit,
    totalOrderAmount,
    depositPercent,
    commission,
    commissionPercent,
    hasCustomDollar,
    hasCustomCommission,
  };
}

/**
 * Extracts only customized/extra slots to store in user.customCombos so unedited baseline slots
 * continue operating in automatic default mode.
 */
export function extractCustomOverridesToSave(
  rows: EffectiveComboRule[],
  user: User
): CustomComboRule[] {
  const baseline = getBaselineComboSchedule(user);
  return rows
    .filter((r) => !r.isAutoFallback || r.isCustomOverride || r.slotIndex >= baseline.length)
    .map((r) => ({
      slotIndex: r.slotIndex,
      stepNumber: r.stepNumber,
      requiredPercent: Number(Number(r.requiredPercent || 0).toFixed(2)),
      commissionPercent: Number(Number(r.commissionPercent || 0).toFixed(2)),
      ...(typeof r.customOrderAmount === 'number' && r.customOrderAmount > 0
        ? { customOrderAmount: Number(r.customOrderAmount.toFixed(2)) }
        : {}),
      ...(typeof r.customDepositAmount === 'number' && r.customDepositAmount >= 0
        ? { customDepositAmount: Number(r.customDepositAmount.toFixed(2)) }
        : {}),
      ...(typeof r.customCommissionAmount === 'number' && r.customCommissionAmount >= 0
        ? { customCommissionAmount: Number(r.customCommissionAmount.toFixed(4)) }
        : {}),
      isCustomOverride: true,
    }))
    .sort((a, b) => a.stepNumber - b.stepNumber);
}



