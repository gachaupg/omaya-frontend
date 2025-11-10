# ChangeNow API Integration

This document describes the integration with ChangeNow API for cryptocurrency swap functionality.

## Overview

The swap feature now integrates with ChangeNow API to provide access to 1,293+ supported cryptocurrencies and tokens across multiple networks.

## API Response Structure

The ChangeNow API returns assets in the following format:

```json
{
  "message": "All ChangeNow tokens retrieved successfully",
  "total_changenow_tokens": 1293,
  "results": [
    {
      "asset_id": "57ab91ba-c934-4686-bd24-929c855edcd3",
      "symbol": "0_eth_0x7db5af",
      "name": "Volt Inu V2 (ERC20)",
      "description": null,
      "asset_image": null,
      "image_url": "",
      "ticker": "0",
      "has_external_id": false,
      "is_extra_id_supported": false,
      "is_fiat": false,
      "featured": false,
      "is_stable": false,
      "supports_fixed_rate": false,
      "network": "eth",
      "token_contract": "0x7db5af2B9624e1b3B4Bb69D6DeBd9aD1016A58Ac",
      "can_buy": false,
      "can_sell": false,
      "legacy_ticker": "volterc20",
      "is_changenow_asset": true
    }
  ]
}
```

## Updated Types

The `SupportedAsset` interface has been updated to match the ChangeNow API response:

```typescript
export interface SupportedAsset {
  asset_id: string;
  symbol: string;
  name: string;
  description: string | null;
  asset_image: string | null;
  image_url: string;
  ticker: string;
  has_external_id: boolean;
  is_extra_id_supported: boolean;
  is_fiat: boolean;
  featured: boolean;
  is_stable: boolean;
  supports_fixed_rate: boolean;
  network: string;
  token_contract: string;
  can_buy: boolean;
  can_sell: boolean;
  legacy_ticker: string;
  is_changenow_asset: boolean;
}
```

## API Functions

### Core Functions

- `getSupportedAssets()` - Retrieves all supported assets from ChangeNow
- `getEstimateSwap()` - Gets swap estimate for a given pair and amount
- `createSwap()` - Creates a new swap transaction
- `getSwapStatus()` - Gets the status of a swap transaction

### Helper Functions

- `getFilteredAssets(options)` - Filters assets based on criteria
- `getAssetsByNetwork(network)` - Gets assets for a specific network
- `getBuyableAssets()` - Gets assets that can be bought
- `getSellableAssets()` - Gets assets that can be sold
- `getFeaturedAssets()` - Gets featured assets

## Usage Examples

```typescript
import { 
  getSupportedAssets, 
  getBuyableAssets, 
  getAssetsByNetwork 
} from './api';

// Get all supported assets
const allAssets = await getSupportedAssets();

// Get only buyable assets
const buyableAssets = await getBuyableAssets();

// Get assets for Ethereum network
const ethAssets = await getAssetsByNetwork('eth');

// Filter assets with custom criteria
const filteredAssets = await getFilteredAssets({
  canBuy: true,
  network: 'bsc',
  featured: true
});
```

## Component Updates

The following components have been updated to work with the new ChangeNow data structure:

- `AssetDropdown.tsx` - Updated to use `asset_id` and `image_url`
- `WalletValidationPage.tsx` - Updated SupportedAsset interface
- `deposit.tsx` (Express) - Updated asset display and selection
- `withdrwal.tsx` (Express) - Updated asset display and selection

## Key Changes

1. **Property Mapping**:
   - `id` → `asset_id`
   - `image` → `image_url` (primary) or `asset_image` (fallback)
   - `icon_url` → `image_url` (primary) or `asset_image` (fallback)

2. **Enhanced Data**: The new structure provides additional information like:
   - `can_buy` and `can_sell` flags
   - `token_contract` addresses
   - `supports_fixed_rate` flag
   - `is_stable` flag for stablecoins
   - `featured` flag for highlighted assets

3. **Network Support**: Assets are now properly categorized by network (eth, bsc, trc20, etc.)

## Testing

Use the test file `test-changenow-integration.ts` to verify the integration:

```typescript
import { testChangeNowIntegration } from './test-changenow-integration';

// Run the test
testChangeNowIntegration().then(result => {
  if (result.success) {
    console.log('Integration test passed!');
  } else {
    console.error('Integration test failed:', result.error);
  }
});
```

## Error Handling

The API functions include comprehensive error handling:

- Network connection issues
- Server errors (500)
- Not found errors (404)
- Invalid parameters (400)
- Authentication errors (401)

All errors are logged and handled gracefully, returning empty arrays or throwing user-friendly error messages as appropriate.

## Backward Compatibility

The API maintains backward compatibility by:
- Supporting both the new ChangeNow response format and direct array responses
- Providing fallback values for missing properties
- Maintaining the same function signatures

## Configuration

The API endpoints are configured in `lib/appConfig.ts`:

```typescript
SWAP: {
  SUPPORTED_ASSETS: "/api/changenow/supported-tokens/",
  ESTIMATE_SWAP: "/api/changenow/estimate/",
  CREATE_SWAP: "/api/changenow/create/",
  SWAP_STATUS: "/api/changenow/status/",
}
```

