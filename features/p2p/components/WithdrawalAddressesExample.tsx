import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store";
import {
  fetchWithdrawalAddresses,
  resetWithdrawalAddressesState,
} from "../slices/orderSlice";

const WithdrawalAddressesExample: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    getWithdrawalAddresses,
    getWithdrawalAddressesLoading,
    getWithdrawalAddressesError,
    getWithdrawalAddressesSuccess,
  } = useSelector((state: RootState) => state.p2pMarket);

  useEffect(() => {
    // Fetch withdrawal addresses when component mounts
    dispatch(fetchWithdrawalAddresses());

    // Cleanup function to reset state when component unmounts
    return () => {
      dispatch(resetWithdrawalAddressesState());
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchWithdrawalAddresses());
  };

  if (getWithdrawalAddressesLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Withdrawal Addresses</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (getWithdrawalAddressesError) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Withdrawal Addresses</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {getWithdrawalAddressesError}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Withdrawal Addresses</h2>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {getWithdrawalAddressesSuccess && getWithdrawalAddresses && (
        <div className="space-y-4">
          {/* Debug Information */}
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>User ID: {getWithdrawalAddresses.debug.user_id}</p>
            <p>Address Count: {getWithdrawalAddresses.debug.address_count}</p>
          </div>

          {/* Addresses List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Your Addresses:</h3>
            {getWithdrawalAddresses.data.map((address) => (
              <div
                key={address.id}
                className="border border-gray-300 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{address.network_name}</p>
                    <p className="text-sm text-gray-600">{address.chain}</p>
                  </div>
                  {address.is_default && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
                  {address.address}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(address.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Debug Addresses */}
          <div className="space-y-3">
            <h3 className="font-semibold">Debug Addresses:</h3>
            {getWithdrawalAddresses.debug.addresses.map((debugAddr, index) => (
              <div
                key={index}
                className="border border-gray-300 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">{debugAddr.chain}</p>
                  <div className="flex space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        debugAddr.assigned
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {debugAddr.assigned ? "Assigned" : "Not Assigned"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        debugAddr.is_activated
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {debugAddr.is_activated ? "Activated" : "Not Activated"}
                    </span>
                  </div>
                </div>
                <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
                  {debugAddr.address}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!getWithdrawalAddresses && !getWithdrawalAddressesLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No withdrawal addresses found.</p>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Load Addresses
          </button>
        </div>
      )}
    </div>
  );
};

export default WithdrawalAddressesExample;
