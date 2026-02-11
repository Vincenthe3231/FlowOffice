'use client'

import { useState, useEffect, useContext } from 'react'
import { Moon, Sun } from 'lucide-react'
import { CustomizerContext } from '@/app/context/CustomizerContext'

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const { activeMode, setActiveMode } = useContext(CustomizerContext)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMode = () => {
    const newMode = activeMode === 'light' ? 'dark' : 'light'
    setActiveMode(newMode)
  }

  if (!mounted) {
    return null
  }

  const isLight = activeMode === 'light'

  return (
    <button
      onClick={toggleMode}
      className="hover:text-primary px-4 dark:hover:text-primary focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-link dark:text-darklink group relative"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary">
        {isLight ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </span>
    </button>
  )
}

export default ThemeToggle

