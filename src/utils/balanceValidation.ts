/**
 * Dynamic Platform Balance Limit Validation & Tier Guidance
 *
 * Tier Ranges:
 * - Amazon (VIP 1): 20 - 498 USDT
 * - Alibaba (VIP 2): 499 - 899 USDT
 * - Aliexpress (VIP 3): ≥ 899 USDT
 */

export type PlatformName = 'Amazon' | 'Alibaba' | 'Aliexpress';
export type VipTierLabel = 'VIP 1' | 'VIP 2' | 'VIP 3';

export interface PlatformTierCheck {
  isEligible: boolean;
  reason: 'ok' | 'too_low' | 'exceeds_tier';
  eligiblePlatform: PlatformName | null;
  eligibleVipTier: VipTierLabel | null;
  message: string | null;
}

export const getEligiblePlatformForBalance = (
  balance: number
): { platform: PlatformName; tier: VipTierLabel } | null => {
  if (balance >= 899) return { platform: 'Aliexpress', tier: 'VIP 3' };
  if (balance > 498) return { platform: 'Alibaba', tier: 'VIP 2' };
  if (balance >= 20) return { platform: 'Amazon', tier: 'VIP 1' };
  return null;
};

export const getPlatformTierCheck = (
  platformName: PlatformName | string,
  balance: number
): PlatformTierCheck => {
  const bal = Number(balance || 0);
  const eligible = getEligiblePlatformForBalance(bal);

  if (platformName === 'Amazon') {
    if (bal < 20) {
      return {
        isEligible: false,
        reason: 'too_low',
        eligiblePlatform: null,
        eligibleVipTier: null,
        message: 'Your balance is insufficient for VIP 1 Amazon. Minimum balance required is 20 USDT.',
      };
    }
    if (bal > 498 && bal < 899) {
      return {
        isEligible: false,
        reason: 'exceeds_tier',
        eligiblePlatform: 'Alibaba',
        eligibleVipTier: 'VIP 2',
        message: 'Your balance is now eligible for VIP 2 Alibaba. Please switch to Alibaba to continue working.',
      };
    }
    if (bal >= 899) {
      return {
        isEligible: false,
        reason: 'exceeds_tier',
        eligiblePlatform: 'Aliexpress',
        eligibleVipTier: 'VIP 3',
        message: 'Your balance is now eligible for VIP 3 Aliexpress. Please switch to Aliexpress to continue working.',
      };
    }
    return {
      isEligible: true,
      reason: 'ok',
      eligiblePlatform: 'Amazon',
      eligibleVipTier: 'VIP 1',
      message: null,
    };
  }

  if (platformName === 'Alibaba') {
    if (bal <= 498) {
      if (bal >= 20) {
        return {
          isEligible: false,
          reason: 'too_low',
          eligiblePlatform: 'Amazon',
          eligibleVipTier: 'VIP 1',
          message:
            'VIP 2 Alibaba requires 499 - 899 USDT. Your balance is eligible for VIP 1 Amazon. Please switch to Amazon to continue working.',
        };
      }
      return {
        isEligible: false,
        reason: 'too_low',
        eligiblePlatform: null,
        eligibleVipTier: null,
        message: 'Your balance is insufficient for VIP 2 Alibaba. Minimum balance required is 499 USDT.',
      };
    }
    if (bal >= 899) {
      return {
        isEligible: false,
        reason: 'exceeds_tier',
        eligiblePlatform: 'Aliexpress',
        eligibleVipTier: 'VIP 3',
        message: 'Your balance is now eligible for VIP 3 Aliexpress. Please switch to Aliexpress to continue working.',
      };
    }
    return {
      isEligible: true,
      reason: 'ok',
      eligiblePlatform: 'Alibaba',
      eligibleVipTier: 'VIP 2',
      message: null,
    };
  }

  if (platformName === 'Aliexpress') {
    if (bal < 899) {
      if (eligible) {
        return {
          isEligible: false,
          reason: 'too_low',
          eligiblePlatform: eligible.platform,
          eligibleVipTier: eligible.tier,
          message: `VIP 3 Aliexpress requires ≥ 899 USDT. Your balance is eligible for ${eligible.tier} ${eligible.platform}. Please switch to ${eligible.platform} to continue working.`,
        };
      }
      return {
        isEligible: false,
        reason: 'too_low',
        eligiblePlatform: null,
        eligibleVipTier: null,
        message: 'Your balance is insufficient for VIP 3 Aliexpress. Minimum balance required is 899 USDT.',
      };
    }
    return {
      isEligible: true,
      reason: 'ok',
      eligiblePlatform: 'Aliexpress',
      eligibleVipTier: 'VIP 3',
      message: null,
    };
  }

  return {
    isEligible: true,
    reason: 'ok',
    eligiblePlatform: eligible?.platform || null,
    eligibleVipTier: eligible?.tier || null,
    message: null,
  };
};

export const getPlatformBalanceValidationMessage = (
  platformName: PlatformName | string,
  balance: number
): string | null => {
  return getPlatformTierCheck(platformName, balance).message;
};
