export const CACHE_TIMES = {
  oneMinute: 60,
  fiveMinutes: 60 * 5,
  fifteenMinutes: 60 * 15,
  oneHour: 60 * 60,
  sixHours: 60 * 60 * 6,
  twelveHours: 60 * 60 * 12,
  oneDay: 60 * 60 * 24,
  oneWeek: 60 * 60 * 24 * 7,
  twoWeeks: 60 * 60 * 24 * 14,
  oneMonth: 60 * 60 * 24 * 30,
} as const;

export type CacheTime = keyof typeof CACHE_TIMES;
