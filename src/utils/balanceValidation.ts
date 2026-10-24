/**
 * Dynamic Platform Balance Limit Validation
 *
 * Rules:
 * 1. If Balance > 498 USDT and < 899 USDT on Amazon:
 *    "Amazon allows 20-498 USDT balance. Your balance is [X] USDT, please upgrade to Alibaba (499-899 USDT) to grab orders."
 * 2. If Balance >= 899 USDT on Amazon or Alibaba:
 *    "Your current balance is [X] USDT. Please proceed to Aliexpress (≥ 899 USDT) to grab orders."
 * 3. If Balance < minimum required balance:
 *    "Your balance is insufficient for this platform. Minimum balance required is [Min] USDT."
 */
export const getPlatformBalanceValidationMessage = (
  platformName: 'Amazon' | 'Alibaba' | 'Aliexpress' | string,
  balance: number
): string | null => {
  const formattedBal = balance.toFixed(2);

  if (platformName === 'Amazon') {
    // Range: 20 - 498 USDT
    if (balance < 20) {
      return `Your balance is insufficient for this platform. Minimum balance required is 20 USDT.`;
    }
    if (balance > 498 && balance < 899) {
      return `Amazon allows 20-498 USDT balance. Your balance is ${formattedBal} USDT, please upgrade to Alibaba (499-899 USDT) to grab orders.`;
    }
    if (balance >= 899) {
      return `Your current balance is ${formattedBal} USDT. Please proceed to Aliexpress (≥ 899 USDT) to grab orders.`;
    }
  } else if (platformName === 'Alibaba') {
    // Range: 499 - 899 USDT
    if (balance < 499) {
      return `Your balance is insufficient for this platform. Minimum balance required is 499 USDT.`;
    }
    if (balance >= 899) {
      return `Your current balance is ${formattedBal} USDT. Please proceed to Aliexpress (≥ 899 USDT) to grab orders.`;
    }
  } else if (platformName === 'Aliexpress') {
    // Range: >= 899 USDT
    if (balance < 899) {
      return `Your balance is insufficient for this platform. Minimum balance required is 899 USDT.`;
    }
  }

  return null;
};
