/**
 * Debug utility to test asset fetching
 */

import { getSupportedAssets } from '../../features/swap/api';
import { cachedGet } from '../cachedApiClient';
import { API_CONFIG } from '../appConfig';

export const debugAssetFetching = async () => {
  console.log('=== DEBUG: Asset Fetching Test ===');
  
  try {
    // Test 1: Direct API call without caching
    console.log('1. Testing direct API call...');
    const directResponse = await cachedGet(API_CONFIG.SWAP.SUPPORTED_ASSETS, {
      cache: false, // Disable caching for this test
      timeout: 10000
    });
    console.log('Direct API response:', directResponse);
    console.log('Direct API data:', directResponse.data);
    console.log('Direct API data length:', (directResponse.data as any)?.results?.length || 0);
    
    // Test 1.5: Check if API endpoint is accessible
    console.log('1.5. Testing API endpoint accessibility...');
    try {
      const testResponse = await fetch(API_CONFIG.SWAP.SUPPORTED_ASSETS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('API endpoint status:', testResponse.status);
      console.log('API endpoint ok:', testResponse.ok);
      if (!testResponse.ok) {
        console.error('API endpoint error:', testResponse.statusText);
      }
    } catch (fetchError) {
      console.error('API endpoint fetch error:', fetchError);
    }
    
    // Test 2: Cached API call
    console.log('2. Testing cached API call...');
    const cachedResponse = await cachedGet(API_CONFIG.SWAP.SUPPORTED_ASSETS, {
      cache: true,
      ttl: 2 * 60 * 60 * 1000,
      timeout: 10000
    });
    console.log('Cached API response:', cachedResponse);
    console.log('Cached API data:', cachedResponse.data);
    console.log('Cached API data length:', (cachedResponse.data as any)?.results?.length || 0);
    
    // Test 3: Using the getSupportedAssets function
    console.log('3. Testing getSupportedAssets function...');
    const assets = await getSupportedAssets();
    console.log('getSupportedAssets result:', assets);
    console.log('getSupportedAssets length:', assets?.length || 0);
    
    return {
      direct: directResponse.data,
      cached: cachedResponse.data,
      function: assets
    };
  } catch (error) {
    console.error('Debug test failed:', error);
    throw error;
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAssetFetching = debugAssetFetching;
}
