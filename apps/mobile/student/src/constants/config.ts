export const APP_NAME = 'ERP SYSTEM';
export const APP_SUBTITLE = 'Educational Management App';
export const SCHOOL_NAME = 'International Delhi Public School';
export const SCHOOL_LOGO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBkV9dfMFaF3n1ILc_yjS92cBmQAoKXUq2g_RI1H2c_lvz8BJhID3zy1Lc126zrVF-CI8T3srddJGuj-21oNSDv8FInBeeLfbDY8Gf2ooxolni4u4bX-3ZCl2GlVnBkVxIWBkGD2k3csAvj5tSUveriJDbrWPMTlVPijZqKigzQhqva69aA7Ib-snNu5DGS1x3ebHdtohaXJeyvpak-p_WgFLaVEe8RYLq3fnpnoisTG_YKjJ43D99tPeeg8Z5-tc0rvXZXP35NuKsF';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.idps-school.local';
export const MOCK_API_DELAY = 600;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  OFFLINE_QUEUE: 'offline_queue',
  NOTIFICATIONS_READ: 'notifications_read',
  HOMEWORK_SEEN: 'homework_seen',
  FEES_STATE: 'fees_state',
  SCHOOL_ID: 'school_id',
} as const;

export const MOCK_CREDENTIALS = {
  email: 'user@school.com',
  password: 'password123',
  otp: '483920',
} as const;
