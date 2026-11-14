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
  isAutoFallback: boolean;
  sourceLabel: string;
}

export const TARGET_CYCLE_COMBO_COUNT = 5;

/**
 * COMBO SCHEDULE RESOLVER:
 * 1. When Admin configures Custom Combos (any count >= 1), honor the exact custom triggers configured by Admin.
 * 2. When VIP (or locked) account is active and no custom combos override it, enforce 5 combos (#8, #15, #19, #23, #25).
 * 3. Standard Cycle 1 generates 1 combo (#14 or #15).
 * 4. Standard Cycle 2 and onwards generates 3 combos (#7, #15, #23).
 */
export function generateHybridComboSchedule(
  user: User,
  overrideCustomCombos?: CustomComboRule[]
): EffectiveComboRule[] {
  const activeCustom =
    overrideCustomCombos !== undefined ? overrideCustomCombos : user.customCombos || [];

  // 1. Admin Custom Combos override: honor exact custom count & steps
  if (activeCustom.length > 0) {
    return [...activeCustom]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((c) => ({
        stepNumber: c.stepNumber,
        requiredPercent: c.requiredPercent,
        commissionPercent: c.commissionPercent,
        isAutoFallback: false,
        sourceLabel: 'Custom Admin Rule',
      }));
  }

  // 2. VIP or Locked Accounts: 5 combos per 25-task cycle
  if (user.isVipAccount || user.isLockedAccount) {
    return DEFAULT_VIP_COMBO_SCHEDULE.map((r) => ({
      ...r,
      isAutoFallback: true,
      sourceLabel: 'Default VIP Rule (5 Combos)',
    }));
  }

  // 3. Cycle 1 -> 1 combo; Cycle 2+ -> 3 combos
  const cycle = user.cycleNumber || 1;
  const cycleSchedule =
    cycle === 1 ? DEFAULT_CYCLE_COMBO_SCHEDULES[1] : DEFAULT_CYCLE_COMBO_SCHEDULES[2];

  return cycleSchedule.map((r) => {
    const step = cycle === 1 && user.comboOrderStep ? user.comboOrderStep : r.stepNumber;
    return {
      stepNumber: step,
      requiredPercent: r.requiredPercent,
      commissionPercent: r.commissionPercent,
      isAutoFallback: true,
      sourceLabel: `Default Cycle #${cycle} Rule`,
    };
  });
}


