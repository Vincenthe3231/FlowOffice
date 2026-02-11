import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual backend API call
    // For testing: This is a placeholder that accepts any email/password
    // In production, this should call your Laravel backend API
    
    // Example: Call Laravel API
    // const laravelApiUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL
    // const response = await fetch(`${laravelApiUrl}/api/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // })
    // const data = await response.json()
    
    // For testing: Return success response
    // This allows testing the frontend authentication flow
    const res = NextResponse.json({
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          email: email,
          name: 'Test User',
        },
        token: 'test-token-' + Date.now(),
      },
    })

    // Set authentication cookie for testing
    res.cookies.set('auth_token', 'test-token-' + Date.now(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
    })

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Unable to sign in. Please try again.' },
      { status: 500 }
    )
  }
}

