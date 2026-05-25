import React, { useState, useEffect } from 'react';
import { PaymentMethod, PaymentProvider } from '../../types/paymentMethods';

// Example component showing how to display payment methods with logos
// This demonstrates how to use the new API response structure you provided

interface PaymentMethodsWithLogosProps {
  paymentMethodsData?: {
    success: boolean;
    message: string;
    data: {
      payment_methods: PaymentMethod[];
      summary: {
        total_payment_methods: number;
        total_providers: number;
        total_payment_details: number;
        available_methods: string[];
      };
    };
  };
}

const PaymentMethodsWithLogos: React.FC<PaymentMethodsWithLogosProps> = ({ 
  paymentMethodsData 
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Example data structure matching your API response
  const exampleData = {
    "success": true,
    "message": "Payment methods retrieved successfully",
    "data": {
      "payment_methods": [
        {
          "method_id": "eeb1db62-0d72-472f-8b24-faacfd030d3f",
          "method_name": "Bank",
          "method_display": "Bank",
          "providers": [
            {
              "provider_id": "5aae0c5e-7fac-4eb0-9202-a2c4b80eacc6",
              "provider_name": "Cooperative Bank",
              "logo": "https://omayabucket.s3.amazonaws.com/bank_logo/cooperative.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW7TPBKP2YLA7Y4X4%2F20251028%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20251028T073303Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=af2270024db2e59766ee51faf1e1fa9126262e6a9d242ffd32835cf8453476fc",
              "payment_details": [
                {
                  "account_name": "Test",
                  "account_number": "246535473",
                  "mobile_number": null,
                  "wallet_address": null,
                  "how_to_send": null,
                  "account_type": "OMAYA",
                  "asset": null,
                  "network": null
                }
              ]
            },
            {
              "provider_id": "96a1fb37-4dfc-474d-9126-50e5d8c73850",
              "provider_name": "Equity bank",
              "logo": "https://omayabucket.s3.amazonaws.com/bank_logo/Equity_Bank_Kenya.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW7TPBKP2YLA7Y4X4%2F20251028%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20251028T073303Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=404b11f1dfdf191d36ebd2363b7bc14649e87c55b2466773eba6d194b6220632",
              "payment_details": [
                {
                  "account_name": "JANE",
                  "account_number": "2334456789",
                  "mobile_number": null,
                  "wallet_address": null,
                  "how_to_send": null,
                  "account_type": "Guest",
                  "asset": null,
                  "network": null
                }
              ]
            }
          ]
        },
        {
          "method_id": "9e93a6ce-bdcd-4d9e-b9e8-64d85d7194eb",
          "method_name": "Crypto",
          "method_display": "Crypto",
          "providers": [
            {
              "provider_id": "60d24e90-c994-485b-abf1-044ef1d56e9b",
              "provider_name": "Bitcoin",
              "logo": "https://omayabucket.s3.amazonaws.com/bank_logo/Bitcoin.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW7TPBKP2YLA7Y4X4%2F20251028%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20251028T073303Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=4a732d2f215c9c6a0dbb02fa8a8f39198e6fab0a55d1db6d46c6aaa0ce5d0879",
              "payment_details": [
                {
                  "account_name": "OMAYA",
                  "account_number": "34523555",
                  "mobile_number": null,
                  "wallet_address": "TNPuGQc5Z6HH5xJ1YZwCYYtToq1ZhPh5Q",
                  "how_to_send": null,
                  "account_type": "OMAYA",
                  "asset": {
                    "symbol": "USDT Tether",
                    "name": "1"
                  },
                  "network": {
                    "network_id": "c8e9042c-0d5a-4707-9f17-036e7547dfc5",
                    "network_type": "BEP20",
                    "display_name": "BEP20 (Binance Smart Chain BSC)"
                  }
                }
              ]
            }
          ]
        }
      ],
      "summary": {
        "total_payment_methods": 5,
        "total_providers": 9,
        "total_payment_details": 10,
        "available_methods": [
          "Bank",
          "Crypto",
          "Forex",
          "Marchant",
          "Mobile"
        ]
      }
    }
  };

  const data = paymentMethodsData || exampleData;
  const paymentMethods = data.data.payment_methods;

  const selectedMethodData = paymentMethods.find(method => method.method_name === selectedMethod);
  const selectedProviderData = selectedMethodData?.providers.find(provider => provider.provider_name === selectedProvider);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-[#18181D] rounded-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Payment Methods with Logos
      </h2>

      {/* Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-[#788099] mb-2">
          Select Payment Method
        </label>
        <select
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#18181D] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
          value={selectedMethod}
          onChange={(e) => {
            setSelectedMethod(e.target.value);
            setSelectedProvider('');
          }}
        >
          <option value="">Choose a payment method</option>
          {paymentMethods.map((method) => (
            <option key={method.method_id} value={method.method_name}>
              {method.method_display}
            </option>
          ))}
        </select>
      </div>

      {/* Provider Selection */}
      {selectedMethodData && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-[#788099] mb-2">
            Select Provider
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedMethodData.providers.map((provider) => (
              <div
                key={provider.provider_id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedProvider === provider.provider_name
                    ? 'border-[#1D8751] bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-[#35353E] hover:border-gray-300 dark:hover:border-[#55555E]'
                }`}
                onClick={() => setSelectedProvider(provider.provider_name)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={provider.logo}
                    alt={`${provider.provider_name} logo`}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default-provider-logo.svg";
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {provider.provider_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[#788099]">
                      {provider.payment_details.length} payment option{provider.payment_details.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Details */}
      {selectedProviderData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Details for {selectedProviderData.provider_name}
          </h3>
          {selectedProviderData.payment_details.map((detail, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-[#788099]">Account Name</label>
                  <p className="font-medium text-gray-900 dark:text-white">{detail.account_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-[#788099]">Account Number</label>
                  <p className="font-medium text-gray-900 dark:text-white">{detail.account_number}</p>
                </div>
                {detail.mobile_number && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-[#788099]">Mobile Number</label>
                    <p className="font-medium text-gray-900 dark:text-white">{detail.mobile_number}</p>
                  </div>
                )}
                {detail.wallet_address && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-[#788099]">Wallet Address</label>
                    <p className="font-medium text-gray-900 dark:text-white break-all">{detail.wallet_address}</p>
                  </div>
                )}
                {detail.how_to_send && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-[#788099]">How to Send</label>
                    <p className="font-medium text-gray-900 dark:text-white">{detail.how_to_send}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500 dark:text-[#788099]">Account Type</label>
                  <p className="font-medium text-gray-900 dark:text-white">{detail.account_type}</p>
                </div>
                {detail.asset && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-[#788099]">Asset</label>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {detail.asset.symbol} - {detail.asset.name}
                    </p>
                  </div>
                )}
                {detail.network && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-[#788099]">Network</label>
                    <p className="font-medium text-gray-900 dark:text-white">{detail.network.display_name}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-400">Total Methods:</span>
            <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
              {data.data.summary.total_payment_methods}
            </span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">Total Providers:</span>
            <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
              {data.data.summary.total_providers}
            </span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">Total Details:</span>
            <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
              {data.data.summary.total_payment_details}
            </span>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">Available:</span>
            <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
              {data.data.summary.available_methods.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsWithLogos;
