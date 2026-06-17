import {
  buyUsdtFromFiatPaid,
  effectiveP2PRate,
  sellUsdtFromFiatReceived,
} from "@/features/p2p/utils/p2pTradeRateAmounts";

export type AmountValidationResult = {
  valid: boolean;
  message: string;
};

/** Parse typed amount; null = empty or still typing (e.g. ".", "12.") */
export function parseTradeAmountInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === "-" || trimmed === "." || trimmed === ",") return null;
  const normalized = trimmed.replace(",", ".");
  if (/^-?\.$/.test(normalized) || /\.$/.test(normalized)) return null;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

export function isIncompleteTradeAmountInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return parseTradeAmountInput(value) === null;
}

/** Smallest USDT amount allowed when buying below the ad's advertised minimum. */
export const BUY_REMAINDER_MIN_USDT = 0.01;

export type BuyOrderBounds = {
  rangeMin: number;
  rangeMax: number;
  availableUsdt: number;
  commissionRate: number;
  rangeCurrency: string;
};

/**
 * When available USDT is less than the ad min order (e.g. 0.20 USDT left, min 10 USDT),
 * allow buying the remainder — effective min drops to a small floor, max = available.
 */
export function isBuyAvailableBelowAdMin(bounds: BuyOrderBounds): boolean {
  const rate = effectiveP2PRate(bounds.commissionRate);
  const orderMinUsdt = bounds.rangeMin / rate;
  return (
    bounds.availableUsdt > 0 && bounds.availableUsdt + 1e-9 < orderMinUsdt
  );
}

export function getBuyOrderLimits(bounds: BuyOrderBounds) {
  const rate = effectiveP2PRate(bounds.commissionRate);
  const orderMinUsdt = bounds.rangeMin / rate;
  const belowAdMin = isBuyAvailableBelowAdMin(bounds);

  const minReceiveUsdt = belowAdMin
    ? Math.min(BUY_REMAINDER_MIN_USDT, bounds.availableUsdt)
    : orderMinUsdt;
  const minSend = belowAdMin
    ? Math.min(BUY_REMAINDER_MIN_USDT * rate, bounds.availableUsdt * rate)
    : bounds.rangeMin;

  const maxSendFromAvailable = bounds.availableUsdt * rate;
  const maxSend = Math.min(bounds.rangeMax, maxSendFromAvailable);
  const maxReceiveUsdt = Math.min(bounds.rangeMax / rate, bounds.availableUsdt);

  return {
    rate,
    minSend,
    maxSend,
    minReceiveUsdt,
    maxReceiveUsdt,
    belowAdMin,
    orderMinUsdt,
  };
}

export function validateBuySendAmount(
  sendAmount: number,
  bounds: BuyOrderBounds
): AmountValidationResult {
  const { minSend, maxSend, rate, belowAdMin } = getBuyOrderLimits(bounds);
  const { rangeCurrency, rangeMax, availableUsdt } = bounds;

  if (sendAmount < minSend) {
    return {
      valid: false,
      message: belowAdMin
        ? `Minimum is ${minSend.toFixed(2)} ${rangeCurrency} (seller has ${availableUsdt.toFixed(2)} USDT left, below order minimum)`
        : `Minimum amount is ${minSend.toFixed(2)} ${rangeCurrency}`,
    };
  }

  if (sendAmount > maxSend) {
    if (sendAmount > rangeMax) {
      return {
        valid: false,
        message: `Maximum order amount is ${rangeMax.toFixed(2)} ${rangeCurrency}`,
      };
    }
    return {
      valid: false,
      message: `Maximum available is ${availableUsdt.toFixed(2)} USDT (${maxSend.toFixed(2)} ${rangeCurrency})`,
    };
  }

  const receiveUsdt = buyUsdtFromFiatPaid(sendAmount, rate);
  if (receiveUsdt > availableUsdt + 1e-9) {
    return {
      valid: false,
      message: `Maximum available is ${availableUsdt.toFixed(2)} USDT`,
    };
  }

  return { valid: true, message: "" };
}

export function validateBuyReceiveUsdt(
  receiveUsdt: number,
  bounds: BuyOrderBounds
): AmountValidationResult {
  const { minReceiveUsdt, maxReceiveUsdt, rate, belowAdMin } =
    getBuyOrderLimits(bounds);
  const { rangeCurrency, rangeMin, rangeMax, availableUsdt } = bounds;

  if (receiveUsdt < minReceiveUsdt) {
    return {
      valid: false,
      message: belowAdMin
        ? `Minimum is ${minReceiveUsdt.toFixed(2)} USDT (only ${availableUsdt.toFixed(2)} USDT available, below order minimum)`
        : `Minimum is ${minReceiveUsdt.toFixed(2)} USDT (${rangeMin.toFixed(2)} ${rangeCurrency})`,
    };
  }

  if (receiveUsdt > maxReceiveUsdt) {
    const maxFromOrderUsdt = rangeMax / rate;
    if (receiveUsdt > maxFromOrderUsdt + 1e-9 && maxFromOrderUsdt < availableUsdt) {
      return {
        valid: false,
        message: `Maximum order is ${maxFromOrderUsdt.toFixed(2)} USDT (${rangeMax.toFixed(2)} ${rangeCurrency})`,
      };
    }
    return {
      valid: false,
      message: `Maximum available is ${availableUsdt.toFixed(2)} USDT`,
    };
  }

  return { valid: true, message: "" };
}

export type SellOrderBounds = {
  minUsdt: number;
  maxUsdt: number;
  walletBalance: number;
  commissionRate: number;
  rangeCurrency: string;
};

export function validateSellSendUsdt(
  sendUsdt: number,
  bounds: SellOrderBounds
): AmountValidationResult {
  const { minUsdt, maxUsdt, walletBalance, commissionRate, rangeCurrency } =
    bounds;
  const effectiveMaxUsdt = Math.min(maxUsdt, walletBalance);

  if (sendUsdt > walletBalance) {
    return {
      valid: false,
      message: `Insufficient balance. Available: ${walletBalance.toFixed(2)} USDT`,
    };
  }

  if (sendUsdt < minUsdt) {
    return {
      valid: false,
      message: `Minimum amount is ${minUsdt.toFixed(2)} USDT`,
    };
  }

  if (sendUsdt > effectiveMaxUsdt) {
    const maxFiat = effectiveMaxUsdt * commissionRate;
    return {
      valid: false,
      message: `Maximum allowed is ${effectiveMaxUsdt.toFixed(2)} USDT (${maxFiat.toFixed(2)} ${rangeCurrency})`,
    };
  }

  return { valid: true, message: "" };
}

export function validateSellReceiveFiat(
  receiveFiat: number,
  bounds: SellOrderBounds
): AmountValidationResult {
  const rate = effectiveP2PRate(bounds.commissionRate);
  const sendUsdt = sellUsdtFromFiatReceived(receiveFiat, rate);
  return validateSellSendUsdt(sendUsdt, bounds);
}
