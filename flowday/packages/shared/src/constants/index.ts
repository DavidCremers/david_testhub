// iOS System Colors (light mode values)
export const COLORS = {
  // System colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Gray scale
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Backgrounds
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',

  // Labels
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  quaternaryLabel: '#3C3C434D',

  // Separators
  separator: '#3C3C4349',
  opaqueSeparator: '#C6C6C8',
} as const;

// Dark mode variants
export const COLORS_DARK = {
  // System colors (same in dark mode)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',

  // Gray scale
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',

  // Backgrounds
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',

  // Labels
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF5',
  tertiaryLabel: '#EBEBF599',
  quaternaryLabel: '#EBEBF54D',

  // Separators
  separator: '#54545899',
  opaqueSeparator: '#38383A',
} as const;

// Spacing (iOS standard)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// Font sizes (iOS Dynamic Type - Default)
export const FONT_SIZE = {
  caption2: 11,
  caption1: 12,
  footnote: 13,
  subheadline: 15,
  callout: 16,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  largeTitle: 34,
} as const;

// SF Symbols commonly used in the app
export const ICONS = {
  // Tab bar
  today: 'calendar',
  todayFilled: 'calendar.fill',
  tasks: 'checklist',
  tasksFilled: 'checklist.checked',
  agenda: 'calendar.day.timeline.leading',
  agendaFilled: 'calendar.day.timeline.leading.fill',
  settings: 'gear',
  settingsFilled: 'gear.fill',

  // Actions
  add: 'plus',
  addCircle: 'plus.circle.fill',
  edit: 'pencil',
  delete: 'trash',
  deleteFill: 'trash.fill',
  check: 'checkmark',
  checkCircle: 'checkmark.circle',
  checkCircleFill: 'checkmark.circle.fill',

  // Task/Event
  circle: 'circle',
  circleFill: 'circle.fill',
  flag: 'flag',
  flagFill: 'flag.fill',
  clock: 'clock',
  clockFill: 'clock.fill',
  location: 'location',
  locationFill: 'location.fill',
  repeat: 'repeat',
  tag: 'tag',
  tagFill: 'tag.fill',
  folder: 'folder',
  folderFill: 'folder.fill',

  // Workspace
  briefcase: 'briefcase',
  briefcaseFill: 'briefcase.fill',
  house: 'house',
  houseFill: 'house.fill',

  // Input
  mic: 'mic',
  micFill: 'mic.fill',
  keyboard: 'keyboard',

  // Navigation
  chevronRight: 'chevron.right',
  chevronLeft: 'chevron.left',
  chevronDown: 'chevron.down',
  chevronUp: 'chevron.up',
  xmark: 'xmark',
  xmarkCircle: 'xmark.circle.fill',
} as const;

// Workspace defaults
export const WORKSPACE_DEFAULTS = {
  work: {
    name: 'Werk',
    color: COLORS.systemBlue,
    icon: ICONS.briefcaseFill,
  },
  private: {
    name: 'Privé',
    color: COLORS.systemGreen,
    icon: ICONS.houseFill,
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
  },
  google: {
    calendar: 'https://www.googleapis.com/calendar/v3',
  },
} as const;
