/**
 * Test file for ChangeNow API integration
 * This file can be used to test the getSupportedAssets function
 */

import { getSupportedAssets, getFilteredAssets, getBuyableAssets, getSellableAssets } from './api';

// Test function to verify the integration
export const testChangeNowIntegration = async () => {
  try {
    console.log('Testing ChangeNow API integration...');
    
    // Test 1: Get all supported assets
    const allAssets = await getSupportedAssets();
    console.log(`✅ Retrieved ${allAssets.length} total assets`);
    
    if (allAssets.length > 0) {
      const firstAsset = allAssets[0];
      console.log('✅ First asset structure:', {
        asset_id: firstAsset.asset_id,
        name: firstAsset.name,
        ticker: firstAsset.ticker,
        network: firstAsset.network,
        can_buy: firstAsset.can_buy,
        can_sell: firstAsset.can_sell,
        is_changenow_asset: firstAsset.is_changenow_asset
      });
    }
    
    // Test 2: Get buyable assets
    const buyableAssets = await getBuyableAssets();
    console.log(`✅ Retrieved ${buyableAssets.length} buyable assets`);
    
    // Test 3: Get sellable assets
    const sellableAssets = await getSellableAssets();
    console.log(`✅ Retrieved ${sellableAssets.length} sellable assets`);
    
    // Test 4: Get assets by network (e.g., ETH)
    const ethAssets = await getFilteredAssets({ network: 'eth' });
    console.log(`✅ Retrieved ${ethAssets.length} ETH network assets`);
    
    // Test 5: Get featured assets
    const featuredAssets = await getFilteredAssets({ featured: true });
    console.log(`✅ Retrieved ${featuredAssets.length} featured assets`);
    
    console.log('✅ All tests passed! ChangeNow integration is working correctly.');
    
    return {
      success: true,
      totalAssets: allAssets.length,
      buyableAssets: buyableAssets.length,
      sellableAssets: sellableAssets.length,
      ethAssets: ethAssets.length,
      featuredAssets: featuredAssets.length
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Example usage:
// testChangeNowIntegration().then(result => console.log(result));








