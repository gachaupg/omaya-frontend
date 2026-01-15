'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const CollapsibleTermsSection = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const preview = [
        '1. Use your own wallet only',
        '2. Correct asset and network required',
        '3. Provide the correct receiving address'
    ];

    const fullTerms = [
        {
            title: '1. Use your own wallet only',
            content: 'You must provide a wallet address that you personally own and control. Third-party or intermediary wallets are not allowed.'
        },
        {
            title: '2. Correct asset and network required',
            content: 'You must provide a USDT wallet address on the BEP20 (BNB Smart Chain) network only. Providing any other asset address or using a different network may result in permanent loss of funds.'
        },
        {
            title: '3. Provide the correct receiving address',
            content: 'You must enter the correct USDT (BEP20) receiving wallet address. Ensure the address is accurate and fully compatible with the BEP20 network before confirming the transaction.'
        },
        {
            title: '4. Irreversible transactions & user responsibility',
            content: 'Blockchain transactions are irreversible. If you provide an incorrect wallet address, or a wallet address on the wrong network, the funds will be permanently lost, and we will not be able to recover or assist in any way.'
        },
        {
            title: '5. Acceptance of terms',
            content: 'Before submitting the withdrawal, you must confirm that you have read and accepted all the terms and conditions listed above, and our full Terms of Service.'
        }
    ];

    return (
        <div className="w-full">
            {!isExpanded ? (
                <div
                    onClick={() => setIsExpanded(true)}
                    className="cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            {preview.map((line, index) => (
                                <div
                                    key={index}
                                    className="text-sm font-medium"
                                    style={{ color: '#1D8751' }}
                                >
                                    {line}
                                </div>
                            ))}
                            <div className="text-xs text-gray-500 mt-2">
                                Click to view all terms...
                            </div>
                        </div>
                        <ChevronDown
                            size={20}
                            style={{ color: '#1D8751' }}
                            className="flex-shrink-0 mt-1"
                        />
                    </div>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-gray-900">
                            Before proceeding with a P2P Withdrawal transaction, please carefully read and agree to the following terms:
                        </p>

                        {fullTerms.map((term, index) => (
                            <div key={index} className="space-y-2">
                                <h3
                                    className="font-semibold text-sm"
                                    style={{ color: '#1D8751' }}
                                >
                                    {term.title}
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {term.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsExpanded(false)}
                        className="w-full mt-4 py-2 px-4 text-sm font-medium rounded-lg border transition-colors"
                        style={{
                            color: '#1D8751',
                            borderColor: '#1D8751',
                            backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(29, 135, 81, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Show less
                    </button>
                </div>
            )}
        </div>
    );
};
