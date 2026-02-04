'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="inline-block mb-2"
            aria-label="Go back"
        >
            <ArrowLeft className="text-muted-foreground cursor-pointer" size={20} />
        </button>
    );
}
