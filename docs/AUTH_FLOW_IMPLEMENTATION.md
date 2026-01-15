# Authentication Flow Implementation - Kunajoto Lean

## Date: January 15, 2026

---

## Overview

This document outlines the changes made to implement mandatory authentication after splash screen for Kunajoto Lean.

---

## Key Changes from Kunajoto-Fire-

### 1. App State Flow

**Kunajoto-Fire- Flow:**
```
SPLASH → GUEST_MAP (optional auth) → PREFERENCE_FLOW (if authenticated) → MAIN_APP
```

**Kunajoto-Lean Flow:**
```
SPLASH → AUTH_REQUIRED → MAIN_APP (landing on Explore tab)
```

### 2. Removed States
- `GUEST_MAP` - No guest access allowed
- `PREFERENCE_FLOW` - No onboarding preference flow
- `PREFERENCE_EDITOR` - Moved to profile settings

### 3. New States
- `AUTH_REQUIRED` - Mandatory authentication screen after splash

---

## Implementation Details

### App.tsx Changes

#### 1. Initial State
```typescript
// OLD (kunajoto-fire-)
const [appState, setAppState] = useState<AppState>(AppState.SPLASH);

// NEW (kunajoto-lean)
const [appState, setAppState] = useState<AppState>(AppState.SPLASH);
// After splash, if not authenticated → AUTH_REQUIRED
// If authenticated → MAIN_APP (landing on 'explore' tab)
```

#### 2. Authentication Check Logic
```typescript
// OLD
if (session) {
  const hasPrefs = localStorage.getItem('kunajoto_preferences_completed') === 'true';
  if (hasPrefs) {
    setAppState(AppState.MAIN_APP);
  } else {
    setAppState(AppState.PREFERENCE_FLOW);
  }
} else {
  setAppState(AppState.GUEST_MAP);
}

// NEW
if (session) {
  setAppState(AppState.MAIN_APP);
  setCurrentTab('explore'); // Land on explore tab
} else {
  setAppState(AppState.AUTH_REQUIRED);
}
```

#### 3. Splash Screen Timeout
```typescript
// After 3 seconds, check auth and redirect
setTimeout(() => {
  if (isAuthenticated) {
    setAppState(AppState.MAIN_APP);
    setCurrentTab('explore');
  } else {
    setAppState(AppState.AUTH_REQUIRED);
  }
}, 3000);
```

#### 4. Auth Success Handler
```typescript
const handleAuthSuccess = async () => {
  setShowAuthModal(false);
  setIsAuthenticated(true);
  
  // Load user data
  const profile = await authService.getUserProfile();
  if (profile) {
    setUserRole(profile.default_role || 'USER');
    setUserEmail(profile.email || '');
    setUserName(profile.full_name || profile.first_name || '');
  }
  
  // Go directly to main app, landing on explore tab
  setAppState(AppState.MAIN_APP);
  setCurrentTab('explore');
};
```

---

## Types.ts Changes

### Updated AppState Enum
```typescript
export enum AppState {
  SPLASH = 'SPLASH',
  AUTH_REQUIRED = 'AUTH_REQUIRED', // NEW
  MAIN_APP = 'MAIN_APP',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  PLANS = 'PLANS'
  // REMOVED: GUEST_MAP, PREFERENCE_FLOW, PREFERENCE_EDITOR
}
```

---

## AuthModal Component

### Changes
- Remove "Skip" or "Continue as Guest" options
- Ensure modal cannot be dismissed without authentication
- Add clear messaging: "Sign up or log in to continue"

---

## SplashScreen Component

### Changes
- Keep brief onboarding cards (3-4 slides)
- After slides, automatically check auth status
- If not authenticated, show AUTH_REQUIRED screen

---

## BottomNav Component

### Changes
- Default tab changed from 'map' to 'explore'
- All tabs require authentication (no guest access)

---

## Profile Component

### Changes
- Remove subscription panel
- Remove preference onboarding button
- Add preferences in settings section (accessible anytime)

---

## Testing Checklist

- [ ] Fresh user sees splash screen
- [ ] After splash, unauthenticated user sees auth screen
- [ ] User cannot bypass auth screen
- [ ] After signup/login, user lands on explore tab
- [ ] Session persists across page reloads
- [ ] Logout returns user to auth screen
- [ ] All tabs require authentication
- [ ] No "ghost account" issues
- [ ] Profile preferences accessible from settings

---

## Migration Notes

### For Existing Users
- Existing users with sessions will continue to work
- No data migration required
- Preferences remain in database but no onboarding flow

### For New Users
- Must sign up/login immediately after splash
- No preference onboarding (can set later in profile)
- Direct access to all features after auth

---

## Security Considerations

1. **Session Persistence**: Supabase Auth handles session persistence
2. **RLS Policies**: All data access requires authentication
3. **No Guest Access**: All features require valid session
4. **BaseJump Integration**: Super admins can manage app admins

---

## Next Steps

1. ✅ Update App.tsx with new auth flow
2. ✅ Update types.ts with new AppState enum
3. ✅ Modify AuthModal to prevent dismissal
4. ✅ Update SplashScreen timeout logic
5. ✅ Change default tab to 'explore'
6. ✅ Remove preference onboarding components
7. ✅ Test auth flow end-to-end
8. ✅ Push changes to feature branch

---

**Implementation Status: In Progress**
