import React, { useState } from 'react';

const ExchangeInterfaceDark = () => {
  const [activeTab, setActiveTab] = useState('express');
  const [payAmount, setPayAmount] = useState('10');
  const [selectedBank, setSelectedBank] = useState('Salam Bank');
  const [getAmount, setGetAmount] = useState('10');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT Tether US');

  const tabs = [
    { id: 'express', label: 'Express XCHANGE' },
    { id: 'moneyx', label: 'MoneyX' },
    { id: 'swap', label: 'Swap Crypto' }
  ];

  const banks = ['Salam Bank', 'National Bank', 'Global Bank', 'Digital Bank'];
  const cryptos = ['USDT Tether US', 'Bitcoin BTC', 'Ethereum ETH', 'BNB'];

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Express /CHANGE</h1>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          
          {/* Tabs Section - Enhanced to match image */}
          <div className="flex border-b border-gray-700 bg-gray-800">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-6 py-5 text-center font-medium text-sm md:text-base transition-all
                  relative group
                  ${activeTab === tab.id
                    ? 'text-white bg-gray-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }
                  ${index < tabs.length - 1 ? 'border-r border-gray-700' : ''}
                  ${index === 0 ? 'rounded-tl-2xl' : ''}
                  ${index === tabs.length - 1 ? 'rounded-tr-2xl' : ''}
                `}
              >
                {tab.label}
                
                {/* Active tab indicator */}
                {activeTab === tab.id ? (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                ) : (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 group-hover:w-4/5"></div>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8">
            {/* Tab Content Indicator */}
            <div className="mb-6 px-4 py-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="text-white font-medium flex items-center">
                <span className="text-blue-400 mr-2">Active:</span>
                {tabs.find(t => t.id === activeTab)?.label}
              </div>
            </div>

            {/* "You Pay" Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 border border-blue-500">
                  1
                </span>
                You Pay
              </h2>
              
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
                {/* Amount Row */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-400 mb-2">Amount</div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="flex-1 text-3xl font-bold text-white bg-transparent border-none outline-none"
                    />
                    <div className="text-gray-400 ml-2">USD</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ≈ $10.00 USD
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 my-4"></div>

                {/* Bank Selection */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-3">Select Bank</div>
                  <div className="space-y-3">
                    {banks.map((bank) => (
                      <label
                        key={bank}
                        className={`
                          flex items-center p-4 rounded-lg border cursor-pointer transition-all
                          ${selectedBank === bank
                            ? 'border-blue-500 bg-gray-800 shadow-lg'
                            : 'border-gray-700 hover:bg-gray-800'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="bank"
                          checked={selectedBank === bank}
                          onChange={() => setSelectedBank(bank)}
                          className="h-5 w-5 text-blue-600"
                        />
                        <div className="ml-3 flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${selectedBank === bank ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                          <span className="font-medium text-white">{bank}</span>
                        </div>
                        {selectedBank === bank && (
                          <svg className="ml-auto w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow Separator */}
            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center border-2 border-gray-800 shadow-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* "You Get" Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="bg-gradient-to-r from-green-600 to-green-800 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 border border-green-500">
                  2
                </span>
                You Get
              </h2>
              
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
                {/* Amount Row */}
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-400 mb-2">Amount</div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={getAmount}
                      onChange={(e) => setGetAmount(e.target.value)}
                      className="flex-1 text-3xl font-bold text-white bg-transparent border-none outline-none"
                    />
                    <div className="text-gray-400 ml-2">USDT</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    ≈ 10.00 USDT
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 my-4"></div>

                {/* Crypto Selection */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-3">Select Crypto</div>
                  <div className="space-y-3">
                    {cryptos.map((crypto) => (
                      <label
                        key={crypto}
                        className={`
                          flex items-center p-4 rounded-lg border cursor-pointer transition-all
                          ${selectedCrypto === crypto
                            ? 'border-blue-500 bg-gray-800 shadow-lg'
                            : 'border-gray-700 hover:bg-gray-800'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="crypto"
                          checked={selectedCrypto === crypto}
                          onChange={() => setSelectedCrypto(crypto)}
                          className="h-5 w-5 text-blue-600"
                        />
                        <div className="ml-3 flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${selectedCrypto === crypto ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                          <span className="font-medium text-white">{crypto}</span>
                        </div>
                        {selectedCrypto === crypto && (
                          <svg className="ml-auto w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-6"></div>

            {/* Disclaimer Section */}
            <div className="mb-8">
              <div className="text-sm text-gray-400 italic mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                This is only an estimated price based on current market rates. 
                The final price will be confirmed when we receive the funds.
              </div>
              
              {/* Exchange Details */}
              <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Exchange Rate</div>
                    <div className="font-semibold text-white">1 USD = 1 USDT</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Processing Time</div>
                    <div className="font-semibold text-white">2-5 minutes</div>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Fee</div>
                    <div className="font-semibold text-green-500">$0.00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <button className="w-full py-4 bg-gradient-to-r from-blue-700 to-purple-700 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Continue to Exchange
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <div className="text-white font-medium text-lg">Express /CHANGE</div>
          <div className="text-sm text-gray-500 mt-2 flex justify-center space-x-6">
            <span>Secure</span>
            <span className="text-gray-600">•</span>
            <span>Fast</span>
            <span className="text-gray-600">•</span>
            <span>Reliable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeInterfaceDark;