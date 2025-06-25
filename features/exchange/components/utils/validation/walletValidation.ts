export function validateWalletAddress(address: string, networkType?: string, assetSymbol?: string): string | null {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return 'Wallet address is required';
  }

  if (assetSymbol === 'USDT') {
    if (!networkType) {
      return 'Please select a network to validate USDT address';
    }
    const networkLower = networkType.toLowerCase();
    // BEP20 (BSC) validation
    if (networkLower.includes('bep20') || networkLower.includes('bsc')) {
      if (!trimmedAddress.startsWith('0x')) {
        return 'BEP20 address must start with 0x';
      }
      if (trimmedAddress.length !== 42) {
        return 'BEP20 address must be exactly 42 characters long';
      }
      if (!/^0x[a-fA-F0-9]{40}$/i.test(trimmedAddress)) {
        return 'Invalid BEP20 address format (must be hexadecimal)';
      }
    }
    // TRC20 (Tron) validation
    else if (networkLower.includes('trc20') || networkLower.includes('tron')) {
      if (!trimmedAddress.startsWith('T')) {
        return 'TRC20 address must start with T';
      }
      if (trimmedAddress.length !== 34) {
        return 'TRC20 address must be exactly 34 characters long';
      }
      if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmedAddress)) {
        return 'Invalid TRC20 address format (must be Base58)';
      }
    }
  }
  return null;
}
