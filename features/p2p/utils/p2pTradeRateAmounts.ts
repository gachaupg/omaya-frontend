/** Fiat per 1 USDT (commission_rate from P2P ads). */
export function effectiveP2PRate(rate: number): number {
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

/** Buy: USDT received = fiat paid / rate */
export function buyUsdtFromFiatPaid(fiatPaid: number, rate: number): number {
  return fiatPaid / effectiveP2PRate(rate);
}

/** Buy: fiat paid = USDT received × rate */
export function buyFiatFromUsdtReceived(usdt: number, rate: number): number {
  return usdt * effectiveP2PRate(rate);
}

/** Sell: fiat received = USDT sent × rate */
export function sellFiatFromUsdtSent(usdt: number, rate: number): number {
  return usdt * effectiveP2PRate(rate);
}

/** Sell: USDT sent = fiat received / rate */
export function sellUsdtFromFiatReceived(fiat: number, rate: number): number {
  return fiat / effectiveP2PRate(rate);
}

export function roundP2PFiat(amount: number): number {
  return Math.round(amount * 100) / 100;
}
