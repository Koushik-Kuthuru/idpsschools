import { useEffect, useState, useCallback } from 'react';

const RESEND_SECONDS = 45;

export function useOtpResend(onResend: () => Promise<void>) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const resend = useCallback(async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setSecondsLeft(RESEND_SECONDS);
    } finally {
      setResending(false);
    }
  }, [secondsLeft, resending, onResend]);

  return { secondsLeft, canResend: secondsLeft <= 0, resending, resend };
}
