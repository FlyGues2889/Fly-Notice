export interface NotificationItem {
  id: string;
  title: string;
  text: string;
  durationSecs: number; // custom duration in seconds for this specific item (or fallback to global)
  colorAccent?: string; // Material You tint override (e.g. primary, secondary, tertiary, error, custom hex)
  isActive: boolean;
  createdAt: string;
}

export interface AppConfig {
  themeMode: 'light' | 'dark' | 'system';
  carouselSpeedSecs: number; // Global default speed
  fontSize: number;
  scriptContent: string;
  scriptEnabled: boolean;
  systemTimeFormat: '12h' | '24h';
  language?: 'en' | 'zh';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn';
  message: string;
}
