'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <h2 className="text-xl font-bold mb-4">Đã xảy ra lỗi!</h2>
            <p className="text-red-500 mb-4">{error.message}</p>
            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-bold"
            >
                Thử lại
            </button>
        </div>
    );
}
