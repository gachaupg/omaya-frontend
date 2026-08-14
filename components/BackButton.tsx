'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { peekLegalReturnPath } from '@/lib/utils/authRedirect';

export default function BackButton() {
    const router = useRouter();

    const handleBack = () => {
        const legalReturnPath = peekLegalReturnPath();
        const currentPath =
            typeof window !== "undefined"
                ? `${window.location.pathname}${window.location.search}${window.location.hash}`
                : "";

        if (legalReturnPath && legalReturnPath !== currentPath) {
            router.push(legalReturnPath);
            return;
        }

        // When page is opened in a new tab (e.g. from policy links with target="_blank"),
        // window.history.length is 1 and router.back() has nowhere to go.
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <button
            onClick={handleBack}
            className="inline-block mb-2"
            aria-label="Go back"
        >
            <ArrowLeft className="text-muted-foreground cursor-pointer" size={20} />
        </button>
    );
}
