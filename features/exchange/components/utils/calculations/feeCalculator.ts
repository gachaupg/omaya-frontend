import { Network } from '../../../types';

export function calculateNetworkFee(assetType: 'Crypto' | 'Forex', selectedNetwork: Network | null, amount: number): number {
  if (assetType === 'Crypto' && selectedNetwork && amount > 0) {
    return parseFloat(selectedNetwork.deposit_fee);
  }
  return 0;
}

export function calculateTotalFees(commission: number, networkFee: number): number {
  return commission + networkFee;
}
