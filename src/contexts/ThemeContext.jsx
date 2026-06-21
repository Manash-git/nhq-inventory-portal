import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { themes } from '../styles/themes'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    let stored = localStorage.getItem('nhq-theme')
    if (stored === 'cohesity' || stored === 'nhqbd') {
      const migrated = stored === 'cohesity' ? 'nhqbd' : 'cohesity'
      localStorage.setItem('nhq-theme', migrated)
      return migrated
    }
    return stored || 'nhqbd'
  })

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('nhq-dark') === 'true'
  })

  const applyTheme = useCallback((themeName, dark) => {
    const theme = themes[themeName]
    if (!theme) return
    const mode = dark ? 'dark' : 'light'
    const vars = theme[mode]
    const root = document.documentElement
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [])

  useEffect(() => {
    applyTheme(currentTheme, isDark)
  }, [currentTheme, isDark, applyTheme])

  const switchTheme = (themeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem('nhq-theme', themeName)
  }

  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('nhq-dark', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      isDark,
      switchTheme,
      toggleDark,
      themes: Object.keys(themes),
      themeNames: Object.fromEntries(Object.entries(themes).map(([k, v]) => [k, v.name]))
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
