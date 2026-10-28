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
 * - Cycle 2: Exactly 3 combos at Task #7 (55%/26%), Task #15 (50%/18%), Task #23 (50%/18%)
 * - Cycle 3+: Exactly 4 combos at Task #7 (55%/26%), Task #13 (50%/18%), Task #18 (50%/18%), Task #23 (50%/18%)
 */
export const DEFAULT_CYCLE_COMBO_SCHEDULES: Record<number, CustomComboRule[]> = {
  1: [{ stepNumber: 14, requiredPercent: 36, commissionPercent: 20 }],
  2: [
    { stepNumber: 7, requiredPercent: 55, commissionPercent: 26 },
    { stepNumber: 15, requiredPercent: 50, commissionPercent: 18 },
    { stepNumber: 23, requiredPercent: 50, commissionPercent: 18 },
  ],
  3: [
    { stepNumber: 7, requiredPercent: 55, commissionPercent: 26 },
    { stepNumber: 13, requiredPercent: 50, commissionPercent: 18 },
    { stepNumber: 18, requiredPercent: 50, commissionPercent: 18 },
    { stepNumber: 23, requiredPercent: 50, commissionPercent: 18 },
  ],
};

export interface EffectiveComboRule extends CustomComboRule {
  isAutoFallback: boolean;
  sourceLabel: string;
}

/**
 * Baseline minimum total combos per cycle when partial custom combos or VIP schedules are configured.
 * When admins configure custom combo counts greater than 5 (e.g. 6 or 7 combos), the system generates
 * and triggers all configured combos with NO upper limit restriction.
 */
export const TARGET_CYCLE_COMBO_COUNT = 5;

/**
 * DYNAMIC COMBO GENERATOR (CUSTOM + HYBRID AUTOMATIC FALLBACK):
 *
 * 1. DYNAMIC ADMIN CUSTOM COMBO COUNT:
 *    - Allows admins to configure arbitrary custom combo counts (e.g., 6, 7, 8, etc., up to 25 tasks per cycle).
 *    - Generates and triggers the EXACT number of custom combos set by the admin without upper limits.
 *    - When activeCustom has 5, 6, 7 or more triggers, all are preserved and triggered on their designated steps.
 *
 * 2. HYBRID FALLBACK FOR PARTIAL CUSTOM CONFIGS:
 *    - When an admin sets partial custom combos (e.g., 1 to 4 custom triggers), the system does not discard slots.
 *    - Automatically fills remaining missing combo slots using default system rule / VIP configuration so that the
 *      total expected combo count meets at least the baseline of 5 combos per cycle.
 *
 * @param user The user object containing cycle, VIP status, balance, etc.
 * @param overrideCustomCombos Optional list of custom combos (e.g. from admin editing form before saving)
 * @returns Array of sorted EffectiveComboRule objects covering all custom (6, 7, etc.) or hybrid combos.
 */
export function generateHybridComboSchedule(
  user: User,
  overrideCustomCombos?: CustomComboRule[]
): EffectiveComboRule[] {
  const activeCustom =
    overrideCustomCombos !== undefined ? overrideCustomCombos : user.customCombos || [];
  const targetTotal = Math.max(TARGET_CYCLE_COMBO_COUNT, activeCustom.length);

  // If no custom combos exist, return standard schedule
  if (activeCustom.length === 0) {
    if (user.isVipAccount || user.isLockedAccount) {
      return DEFAULT_VIP_COMBO_SCHEDULE.map((r) => ({
        ...r,
        isAutoFallback: true,
        sourceLabel: 'Default VIP Rule',
      }));
    }
    const cycle = user.cycleNumber || 1;
    const cycleSchedule =
      DEFAULT_CYCLE_COMBO_SCHEDULES[cycle] || DEFAULT_CYCLE_COMBO_SCHEDULES[3];
    return cycleSchedule.map((r) => {
      // For Cycle 1, respect user's designated planned combo step (14 or 15)
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

  // 1. First, include all custom combos configured by the admin:
  const result: EffectiveComboRule[] = activeCustom.map((c) => ({
    stepNumber: c.stepNumber,
    requiredPercent: c.requiredPercent,
    commissionPercent: c.commissionPercent,
    isAutoFallback: false,
    sourceLabel: 'Custom Admin Rule',
  }));

  // If the admin already provided 5 or more custom combos, no auto-filling is required:
  if (result.length >= targetTotal) {
    return result.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  // Set of steps already occupied by custom rules
  const occupiedSteps = new Set<number>(result.map((r) => r.stepNumber));

  // 2. Build candidate pool for filling the remaining missing slots:
  // If user is marked as VIP or locked account, draw directly from the 5-combo VIP schedule.
  // Otherwise, draw first from the user's cycle default rules, then from the VIP schedule.
  const candidates: { rule: CustomComboRule; label: string }[] = [];

  if (user.isVipAccount || user.isLockedAccount) {
    for (const v of DEFAULT_VIP_COMBO_SCHEDULE) {
      candidates.push({ rule: v, label: 'Default VIP Rule' });
    }
  } else {
    const cycle = user.cycleNumber || 1;
    const cycleSchedule =
      DEFAULT_CYCLE_COMBO_SCHEDULES[cycle] || DEFAULT_CYCLE_COMBO_SCHEDULES[3];

    for (const c of cycleSchedule) {
      const step = cycle === 1 && user.comboOrderStep ? user.comboOrderStep : c.stepNumber;
      candidates.push({
        rule: { ...c, stepNumber: step },
        label: `Default Cycle #${cycle} Rule`,
      });
    }

    for (const v of DEFAULT_VIP_COMBO_SCHEDULE) {
      if (!candidates.some((c) => c.rule.stepNumber === v.stepNumber)) {
        candidates.push({ rule: v, label: 'Default VIP Rule' });
      }
    }
  }

  // 3. Fill missing slots sequentially from candidate list without colliding with existing steps
  for (const { rule, label } of candidates) {
    if (result.length >= targetTotal) break;
    if (!occupiedSteps.has(rule.stepNumber)) {
      occupiedSteps.add(rule.stepNumber);
      result.push({
        stepNumber: rule.stepNumber,
        requiredPercent: rule.requiredPercent,
        commissionPercent: rule.commissionPercent,
        isAutoFallback: true,
        sourceLabel: label,
      });
    }
  }

  // 4. Safeguard: In case of collision with all candidates, draw from well-spaced fallback steps
  const fallbackSteps = [7, 8, 12, 14, 15, 18, 19, 21, 23, 25];
  for (const step of fallbackSteps) {
    if (result.length >= targetTotal) break;
    if (!occupiedSteps.has(step)) {
      occupiedSteps.add(step);
      result.push({
        stepNumber: step,
        requiredPercent: 50,
        commissionPercent: 20,
        isAutoFallback: true,
        sourceLabel: 'Automatic System Rule',
      });
    }
  }

  // 5. Ultimate fallback across steps 1..25
  for (let s = 1; s <= 25 && result.length < targetTotal; s++) {
    if (!occupiedSteps.has(s)) {
      occupiedSteps.add(s);
      result.push({
        stepNumber: s,
        requiredPercent: 40,
        commissionPercent: 20,
        isAutoFallback: true,
        sourceLabel: 'Automatic System Rule',
      });
    }
  }

  return result.sort((a, b) => a.stepNumber - b.stepNumber);
}
