const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const frontendIdleTimeoutMinutes = parsePositiveInteger(
  process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES,
  60,
);

export const frontendIdleTimeoutMs = frontendIdleTimeoutMinutes * 60 * 1000;

export const apiTimeoutMs = frontendIdleTimeoutMs;
