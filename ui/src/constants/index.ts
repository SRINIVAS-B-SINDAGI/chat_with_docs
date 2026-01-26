import { ThemeName } from '../types'

export const API_BASE = 'http://localhost:8000'

export const THEMES: ThemeName[] = ['sunset', 'ocean', 'forest', 'midnight']

export const THEME_LABELS: Record<ThemeName, string> = {
  sunset: 'Sunset',
  ocean: 'Ocean',
  forest: 'Forest',
  midnight: 'Midnight'
}

export const VALID_FILE_EXTENSIONS = ['.pdf', '.txt']

export const POLL_INTERVAL = 1000 // 1 second
export const MAX_POLL_ATTEMPTS = 60
