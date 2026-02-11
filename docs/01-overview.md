# Frontend Integration Guide: Lark + Laravel + Supabase

> **How to make Next.js, Lark, Laravel, and Supabase work seamlessly together**

---

## Integration Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Lark Mobile App                                             │
│  ├─ OAuth (login)                                            │
│  ├─ JS SDK (GPS, Camera)                                     │
│  └─ Hosts Next.js via h5_sdk                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend                                            │
│  ├─ Gets Lark code → Exchanges with Laravel                  │
│  ├─ Receives: { api_token, supabase_token }                  │
│  ├─ Calls Laravel API (api_token)                            │
│  └─ Subscribes to Supabase Realtime (supabase_token)         │
└────┬──────────────────────────┬─────────────────────────────┘
     │                          │
     │ REST API                 │ WebSocket
     │ (api_token)              │ (supabase_token)
     │                          │
     ▼                          ▼
┌──────────────────┐    ┌────────────────────┐
│  Laravel API     │    │  Supabase          │
│  (Authoritative) │───▶│  (Subordinate)     │
│                  │    │                    │
│  • Validation    │    │  • Realtime        │
│  • Business      │    │  • Storage         │
│  • Audit         │    │  • RLS (defense)   │
└──────────────────┘    └────────────────────┘
```

---

## Step-by-Step Integration Setup

### 1. Authentication Flow (Lark → Laravel → Supabase)

#### 1.1 Initialize Lark SDK in Next.js

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Lark JS SDK */}
        <script src="https://lf-cdn.larksuite.com/obj/goofy/fe/h5_sdk/h5_sdk_v2.js"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}

// src/features/lark-sdk/index.ts
declare global {
  interface Window {
    tt: {
      getLocation(config: { type: 'gcj02' }): Promise<{
        latitude: number
        longitude: number
        accuracy: number
      }>
      chooseImage(config: {
        sourceType: ('camera' | 'album')[]
        count?: number
      }): Promise<{
        tempFilePaths: string[]
      }>
      getWifiStatus(): Promise<{
        ssid: string
        bssid: string
      }>
    }
  }
}

export const larkSDK = {
  isAvailable: () => typeof window !== 'undefined' && !!window.tt,
  
  async getLocation() {
    if (!this.isAvailable()) {
      throw new Error('Lark SDK not available')
    }
    return window.tt.getLocation({ type: 'gcj02' })
  },
  
  async captureImage() {
    if (!this.isAvailable()) {
      throw new Error('Lark SDK not available')
    }
    return window.tt.chooseImage({
      sourceType: ['camera'],
      count: 1,
    })
  },
  
  async getWifi() {
    if (!this.isAvailable()) {
      throw new Error('Lark SDK not available')
    }
    return window.tt.getWifiStatus()
  },
}
```

#### 1.2 Lark OAuth Login

```typescript
// src/lib/auth/lark-auth.ts (planned)
export async function loginWithLark(code: string): Promise<AuthTokens> {
  // Exchange Lark code with Laravel
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/lark/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  
  if (!response.ok) {
    throw new Error('Lark login failed')
  }
  
  const data = await response.json()
  
  // Laravel returns both tokens
  return {
    apiToken: data.api_token,        // For Laravel API calls
    supabaseToken: data.supabase_token, // For Supabase Realtime
    user: data.user,
  }
}

// src/shared/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  user: User | null
  apiToken: string | null
  supabaseToken: string | null
  
  setTokens: (tokens: AuthTokens) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      apiToken: null,
      supabaseToken: null,
      
      setTokens: (tokens) => set({
        user: tokens.user,
        apiToken: tokens.apiToken,
        supabaseToken: tokens.supabaseToken,
      }),
      
      logout: () => set({
        user: null,
        apiToken: null,
        supabaseToken: null,
      }),
      
      isAuthenticated: () => !!get().apiToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist tokens, not user object
        apiToken: state.apiToken,
        supabaseToken: state.supabaseToken,
      }),
    }
  )
)

// src/app/auth/callback/page.tsx (planned)
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginWithLark } from '@/lib/auth/lark-auth'
import { useAuthStore } from '@/shared/stores/auth-store'

export default function LarkCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setTokens = useAuthStore((state) => state.setTokens)
  
  useEffect(() => {
    const code = searchParams.get('code')
    
    if (!code) {
      router.push('/login')
      return
    }
    
    loginWithLark(code)
      .then((tokens) => {
        setTokens(tokens)
        router.push('/attendance')
      })
      .catch((error) => {
        console.error('Login failed:', error)
        router.push('/login?error=auth_failed')
      })
  }, [searchParams, router, setTokens])
  
  return <div>Logging in...</div>
}
```

---

### 2. Laravel API Integration

#### 2.1 API Client Setup

```typescript
// src/shared/lib/api-client/laravel-client.ts
import { useAuthStore } from '@/shared/stores/auth-store'

class LaravelAPIClient {
  private baseURL: string
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  
  private getHeaders(): HeadersInit {
    const apiToken = useAuthStore.getState().apiToken
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
    }
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API Error')
    }
    
    return response.json()
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const api = new LaravelAPIClient()
```

#### 2.2 TanStack Query Integration

```typescript
// src/shared/lib/api-client/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
      
      // Global error handler
      onError: (error) => {
        console.error('Query error:', error)
        
        // Handle 401 Unauthorized
        if (error.message.includes('401')) {
          // Logout user
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      },
    },
    mutations: {
      retry: 0,
    },
  },
})

// app/layout.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/api-client/query-client'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### 2.3 Module API Example

```typescript
// src/features/attendance/api/attendance-api.ts
import { api } from '@/shared/lib/api-client/laravel-client'
import type { Attendance, ClockInData } from '../types/attendance.types'

export const attendanceApi = {
  async clockIn(data: ClockInData): Promise<Attendance> {
    return api.post<Attendance>('/api/attendance/clock-in', data)
  },
  
  async clockOut(attendanceId: number): Promise<Attendance> {
    return api.post<Attendance>(`/api/attendance/${attendanceId}/clock-out`, {})
  },
  
  async getList(userId: number): Promise<Attendance[]> {
    return api.get<Attendance[]>(`/api/attendance/list?user_id=${userId}`)
  },
  
  async getStats(userId: number): Promise<AttendanceStats> {
    return api.get<AttendanceStats>(`/api/attendance/stats?user_id=${userId}`)
  },
}

// src/features/attendance/hooks/useClockIn.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi } from '../api/attendance-api'
import { larkSDK } from '@/features/lark-sdk'
import { eventBus } from '@/shared/lib/event-bus'
import { AttendanceEvents } from '../events/attendance-events'

export function useClockIn() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // Get location from Lark SDK
      const location = await larkSDK.getLocation()
      const wifi = await larkSDK.getWifi()
      
      // Call Laravel API
      return attendanceApi.clockIn({
        latitude: location.latitude,
        longitude: location.longitude,
        wifiSsid: wifi.ssid,
      })
    },
    
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      
      // Publish event for other modules
      // Note: eventBus is currently a placeholder - will be implemented in Phase 3
      eventBus.emit(AttendanceEvents.CLOCKED_IN, {
        userId: data.user_id,
        attendanceId: data.id,
        clockedAt: data.clocked_at,
      })
    },
  })
}
```

---

### 3. Supabase Integration

#### 3.1 Supabase Client Setup

```typescript
// src/shared/lib/supabase/client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useAuthStore } from '@/shared/stores/auth-store'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient
  
  const supabaseToken = useAuthStore.getState().supabaseToken
  
  if (!supabaseToken) {
    throw new Error('Supabase token not available. User must be logged in.')
  }
  
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
        },
      },
      auth: {
        persistSession: false, // We manage auth via Laravel
      },
    }
  )
  
  return supabaseClient
}

// Reset client when user logs out
useAuthStore.subscribe((state) => {
  if (!state.supabaseToken) {
    supabaseClient = null
  }
})
```

#### 3.2 Realtime Subscriptions

```typescript
// src/shared/hooks/useSupabaseRealtime.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/shared/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeConfig = {
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  filter?: string
  onPayload: (payload: any) => void
}

export function useSupabaseRealtime({
  table,
  event,
  schema = 'public',
  filter,
  onPayload,
}: RealtimeConfig) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    let channel: RealtimeChannel | null = null
    
    try {
      const supabase = getSupabaseClient()
      
      channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table,
            ...(filter && { filter }),
          },
          (payload) => {
            console.log('Realtime update:', payload)
            onPayload(payload)
          }
        )
        .subscribe()
      
      return () => {
        if (channel) {
          supabase.removeChannel(channel)
        }
      }
    } catch (error) {
      console.error('Realtime subscription error:', error)
    }
  }, [table, event, schema, filter, onPayload])
}

// src/features/attendance/hooks/useAttendanceRealtime.ts
import { useSupabaseRealtime } from '@/shared/hooks/useSupabaseRealtime'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/stores/auth-store'

export function useAttendanceRealtime() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  
  useSupabaseRealtime({
    table: 'attendance',
    event: 'INSERT',
    filter: `user_id=eq.${user?.id}`,
    onPayload: (payload) => {
      // Add new record to cache
      queryClient.setQueryData<Attendance[]>(
        ['attendance', 'list', user?.id],
        (old) => [payload.new, ...(old || [])]
      )
    },
  })
  
  useSupabaseRealtime({
    table: 'attendance',
    event: 'UPDATE',
    filter: `user_id=eq.${user?.id}`,
    onPayload: (payload) => {
      // Update existing record in cache
      queryClient.setQueryData<Attendance[]>(
        ['attendance', 'list', user?.id],
        (old) => old?.map((item) =>
          item.id === payload.new.id ? payload.new : item
        )
      )
    },
  })
}

// Usage in component
export function AttendanceView() {
  useAttendanceRealtime() // Subscribe to realtime updates
  
  const { data: attendance } = useAttendanceList()
  
  return <AttendanceList data={attendance} />
}
```

#### 3.3 Storage Integration

```typescript
// src/shared/lib/supabase/storage.ts
import { getSupabaseClient } from './client'

export const supabaseStorage = {
  async uploadReceipt(file: File, userId: number): Promise<string> {
    const supabase = getSupabaseClient()
    
    const fileName = `${userId}/${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    return data.path
  },
  
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`)
    }
    
    return data.signedUrl
  },
  
  async deleteReceipt(path: string): Promise<void> {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase.storage
      .from('receipts')
      .remove([path])
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  },
}

// src/features/claims/hooks/useUploadReceipt.ts
import { useMutation } from '@tanstack/react-query'
import { supabaseStorage } from '@/shared/lib/supabase/storage'
import { useAuthStore } from '@/shared/stores/auth-store'

export function useUploadReceipt() {
  const user = useAuthStore((state) => state.user)
  
  return useMutation({
    mutationFn: async (file: File) => {
      // Upload to Supabase Storage
      const path = await supabaseStorage.uploadReceipt(file, user!.id)
      
      // Get signed URL for display
      const url = await supabaseStorage.getSignedUrl(path)
      
      return { path, url }
    },
  })
}
```

---

### 4. Handling Hydration Mismatches (Zustand + SSR)

```typescript
// src/shared/hooks/useHydration.ts
import { useEffect, useState } from 'react'

export function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  return hydrated
}

// src/shared/stores/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-preferences',
    }
  )
)

// Safe usage in component
export function Sidebar() {
  const hydrated = useHydration()
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  
  // Don't render until hydrated (prevents mismatch)
  if (!hydrated) {
    return <SidebarSkeleton />
  }
  
  return (
    <aside className={sidebarOpen ? 'open' : 'closed'}>
      {/* Sidebar content */}
    </aside>
  )
}
```

---

### 5. Complete Data Flow Example

```typescript
// src/features/attendance/components/ClockInButton.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useClockIn } from '../hooks/useClockIn'
import { useAttendanceRealtime } from '../hooks/useAttendanceRealtime'
import { useToast } from '@/shared/hooks/useToast'

export function ClockInButton() {
  const { mutate: clockIn, isPending } = useClockIn()
  const { toast } = useToast()
  
  // Subscribe to realtime updates
  useAttendanceRealtime()
  
  const handleClockIn = () => {
    clockIn(undefined, {
      onSuccess: () => {
        toast({
          title: 'Clocked in successfully!',
          description: 'Your attendance has been recorded.',
        })
      },
      onError: (error) => {
        toast({
          title: 'Clock-in failed',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  }
  
  return (
    <Button onClick={handleClockIn} disabled={isPending}>
      {isPending ? 'Clocking in...' : 'Clock In'}
    </Button>
  )
}

// Data flow:
// 1. User clicks button
// 2. useClockIn → larkSDK.getLocation() (GPS from Lark)
// 3. useClockIn → attendanceApi.clockIn() (POST to Laravel)
// 4. Laravel validates, saves to Supabase
// 5. Supabase fires postgres_changes event
// 6. useAttendanceRealtime receives update via WebSocket
// 7. TanStack Query cache updated
// 8. UI re-renders with new data
```

---

## Common Integration Issues & Solutions

### Issue 1: "Supabase token not available"

**Cause:** Trying to access Supabase before user is logged in

**Solution:**
```typescript
// Protect routes with middleware
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if user has auth token
  const authToken = request.cookies.get('auth-storage')?.value
  
  if (!authToken && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
}
```

### Issue 2: "CORS errors when calling Laravel"

**Solution:**
```php
// Laravel: config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'https://your-vercel-app.vercel.app',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### Issue 3: "Realtime not working"

**Checklist:**
```typescript
// 1. Check Supabase JWT is valid
const token = useAuthStore.getState().supabaseToken
console.log('Token:', token)

// 2. Check RLS policies allow subscription
// In Supabase SQL Editor:
SELECT * FROM attendance WHERE auth.uid()::text = user_id::text;

// 3. Check subscription is active
const channel = supabase.channel('test')
channel.subscribe((status) => {
  console.log('Subscription status:', status)
})

// 4. Verify table has REPLICA IDENTITY
-- In Supabase SQL Editor:
ALTER TABLE attendance REPLICA IDENTITY FULL;
```

### Issue 4: "Lark SDK not available"

**Solution:**
```typescript
// Always check SDK availability
export function ClockInButton() {
  const [sdkReady, setSDKReady] = useState(false)
  
  useEffect(() => {
    // Wait for Lark SDK to load
    if (typeof window !== 'undefined' && window.tt) {
      setSDKReady(true)
    }
  }, [])
  
  if (!sdkReady) {
    return <Button disabled>Loading SDK...</Button>
  }
  
  return <Button onClick={handleClockIn}>Clock In</Button>
}
```

---

## Environment Variables Setup

```bash
# .env.local (Next.js)

# Laravel API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Lark
NEXT_PUBLIC_LARK_APP_ID=cli_xxxxx
NEXT_PUBLIC_LARK_REDIRECT_URI=https://your-app.com/auth/callback
```

---

## Testing the Integration

```typescript
// __tests__/integration/lark-laravel-supabase.test.ts

describe('Lark + Laravel + Supabase Integration', () => {
  it('should complete full clock-in flow', async () => {
    // 1. Mock Lark SDK
    global.window.tt = {
      getLocation: jest.fn().resolves({
        latitude: 3.1390,
        longitude: 101.6869,
        accuracy: 5,
      }),
      getWifiStatus: jest.fn().resolves({
        ssid: 'OfficeWiFi',
      }),
    }
    
    // 2. Mock Laravel API
    fetchMock.post('/api/attendance/clock-in', {
      status: 200,
      body: {
        id: 1,
        user_id: 123,
        clocked_at: '2026-02-06T08:30:00Z',
      },
    })
    
    // 3. Render component
    render(<ClockInButton />)
    
    // 4. Click button
    fireEvent.click(screen.getByText('Clock In'))
    
    // 5. Verify Lark SDK called
    await waitFor(() => {
      expect(window.tt.getLocation).toHaveBeenCalled()
    })
    
    // 6. Verify Laravel API called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/attendance/clock-in',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('latitude'),
        })
      )
    })
    
    // 7. Verify success message
    expect(screen.getByText('Clocked in successfully!')).toBeInTheDocument()
  })
})
```

---

## Summary Checklist

```
✅ Lark Integration:
☐ Lark JS SDK loaded in layout
☐ Lark OAuth flow implemented
☐ SDK availability checks in place
☐ Type definitions for window.tt

✅ Laravel Integration:
☐ API client with token management
☐ TanStack Query configured
☐ Error handling (401, 403, 500)
☐ CORS configured in Laravel

✅ Supabase Integration:
☐ Client created with JWT from Laravel
☐ Realtime subscriptions working
☐ Storage upload/download working
☐ RLS policies tested

✅ State Management:
☐ Auth tokens in Zustand (persisted)
☐ Server state in TanStack Query
☐ UI state in Zustand (hydration-safe)
☐ No server state in Zustand

✅ Module Communication:
☐ Event bus for cross-module events
☐ No direct module imports
☐ Public APIs defined in index.ts
```

The key is **clear separation of concerns**:
- **Lark** = UI shell + native capabilities
- **Laravel** = Business rules + validation
- **Supabase** = Storage + realtime delivery
- **Next.js** = Orchestration layer

Each plays its role, none steps on the other's toes! 🎯