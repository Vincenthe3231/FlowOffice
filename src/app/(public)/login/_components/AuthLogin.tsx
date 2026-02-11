'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

const AuthLogin = () => {
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()

    if (!email || !password) {
      setFormError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      // Call API route for login
      const response = await axios.post('/api/auth/login', { email, password })
      
      if (response.data) {
        // Use hard redirect to ensure fresh page load and proper session initialization
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      setIsLoading(false)
      // API returned 401
      if (error?.response?.status === 401) {
        setFormError('Email or password is incorrect')
        return
      }

      // Network / unknown error
      setFormError('Unable to sign in. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="mb-4">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          className='bg-white dark:bg-dark'
          required
          placeholder="Enter your email"
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Enter your password"
            className="pr-10 bg-white dark:bg-dark"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-between my-5">
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className='text-black'>Remember this device</Label>
        </div>

        <Link
          href="/forgot-password"
          className="text-primary text-sm font-medium"
        >
          Forgot Password?
        </Link>
      </div>

      {formError && (
        <div className="mb-4 text-sm font-medium text-red-600">
          {formError}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}

export default AuthLogin
