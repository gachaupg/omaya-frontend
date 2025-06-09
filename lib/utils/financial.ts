import Decimal from "decimal.js";

// Configure Decimal.js for high precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface WithdrawalCalculation {
  grossAmount: Decimal;
  fee: Decimal;
  netAmount: Decimal;
}

export class FinancialCalculator {
  static calculateWithdrawalAmount(
    amount: string | number,
    fee: string | number
  ): WithdrawalCalculation {
    const grossAmount = new Decimal(amount);
    const feeAmount = new Decimal(fee);
    const netAmount = grossAmount.minus(feeAmount);

    return {
      grossAmount,
      fee: feeAmount,
      netAmount,
    };
  }

  static toNumber(value: string | number): number {
    return new Decimal(value).toNumber();
  }

  static isValidAmount(amount: string | number): boolean {
    try {
      const value = new Decimal(amount);
      return value.isFinite() && value.greaterThanOrEqualTo(0);
    } catch {
      return false;
    }
  }

  static isLessThan(a: string | number, b: string | number): boolean {
    return new Decimal(a).lessThan(b);
  }

  static isGreaterThan(a: string | number, b: string | number): boolean {
    return new Decimal(a).greaterThan(b);
  }

  static add(a: string | number, b: string | number): string {
    return new Decimal(a).plus(b).toString();
  }

  static multiply(a: string | number, b: string | number): string {
    return new Decimal(a).times(b).toString();
  }
}
