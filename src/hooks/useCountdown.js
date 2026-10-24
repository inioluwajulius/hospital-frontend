import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds-remaining countdown, e.g. for "Resend code in 45s".
 * @returns {[number, Function]} seconds left and a function to start a new countdown
 */
export const useCountdown = (initialSeconds = 0) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    useEffect(() => {
        if (secondsLeft <= 0) return undefined;
        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    const start = useCallback((seconds) => setSecondsLeft(Math.max(0, Math.ceil(seconds))), []);

    return [secondsLeft, start];
};

export default useCountdown;
