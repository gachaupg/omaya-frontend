import { Asset, RangeCommission } from '../../../types';

export function calculateCommission(asset: Asset, amount: number): { commission: number; commissionRate: number } {
  let commission = 0;
  let commissionRate = 0;
  if (asset?.range_commissions && amount > 0) {
    const commissionObj = asset.range_commissions.find(
      (rc: RangeCommission) => rc.commission_type === 'deposit' &&
        amount >= parseFloat(rc.range_min) &&
        amount <= parseFloat(rc.range_max)
    );
    if (commissionObj) {
      commissionRate = parseFloat(commissionObj.commission);
      commission = (amount * commissionRate) / 100;
    }
  }
  return { commission, commissionRate };
}
