'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/shared/lib/validation/auth.schemas'
import { useLoginMutation } from '@/shared/hooks/useLoginMutation'

const AuthLogin = () => {
  const [showPassword, setShowPassword] = useState(false)

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // TanStack Query mutation
  const loginMutation = useLoginMutation()

  /**
   * Handle form submit
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data)
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard'
    } catch (error) {
      // Error is handled by mutation and displayed below
      console.error('Login error:', error)
    }
  }

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = () => {
    if (!loginMutation.isError) return null

    const error = loginMutation.error as any

    // Laravel returned 401 (invalid credentials)
    if (error?.status === 401) {
      return 'Email or password is incorrect'
    }

    // Laravel returned 422 (validation errors)
    if (error?.status === 422) {
      return error.message || 'Invalid input'
    }

    // Network or connection error
    return 'Unable to sign in. Please try again.'
  }

  const errorMessage = getErrorMessage()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
      <div className="mb-4">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="bg-background text-foreground"
          placeholder="Enter your email"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="mb-4">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="pr-10 bg-background text-foreground"
            {...register('password')}
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
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-between my-5">
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-foreground">
            Remember this device
          </Label>
        </div>

        <Link
          href="/forgot-password"
          className="text-primary text-sm font-medium"
        >
          Forgot Password?
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}

export default AuthLogin
