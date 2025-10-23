/**
 * Debug utility to test asset fetching
 */

import { getSupportedAssets } from '../../features/swap/api';
import { cachedGet } from '../cachedApiClient';
import { API_CONFIG } from '../appConfig';

export const debugAssetFetching = async () => {
 
  
  try {
    // Test 1: Direct API call without caching
    
    const directResponse = await cachedGet(API_CONFIG.SWAP.SUPPORTED_ASSETS, {
      cache: false, // Disable caching for this test
      timeout: 10000
    });
   
    
    // Test 1.5: Check if API endpoint is accessible
    
    try {
      const testResponse = await fetch(API_CONFIG.SWAP.SUPPORTED_ASSETS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
     
      if (!testResponse.ok) {
      
      }
    } catch (fetchError) {
      
    }
    
    // Test 2: Cached API call
   
    const cachedResponse = await cachedGet(API_CONFIG.SWAP.SUPPORTED_ASSETS, {
      cache: true,
      ttl: 2 * 60 * 60 * 1000,
      timeout: 10000
    });
  
    
    // Test 3: Using the getSupportedAssets function
    const assets = await getSupportedAssets();
   
    
    return {
      direct: directResponse.data,
      cached: cachedResponse.data,
      function: assets
    };
  } catch (error) {
    
    throw error;
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAssetFetching = debugAssetFetching;
}
