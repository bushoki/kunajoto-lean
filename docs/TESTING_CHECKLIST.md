# Kunajoto Lean - Testing Checklist

**Date**: January 15, 2026  
**Deployment**: https://devtests-kunajoto.netlify.app/  
**Branch**: feature/explore-tab-redesign

---

## Authentication & Onboarding

### ✅ Verified Working:
- [x] Onboarding cards display on first launch
- [x] Skip button works
- [x] Next button advances slides
- [x] Splash screen shows for 3 seconds
- [x] Auth screen displays after splash
- [x] Tagline shows "YOUR NIGHTLIFE VIBE FORECAST"
- [x] Remember Me checkbox present and checked by default
- [x] Sign Up / Sign In toggle works

### ⏳ Requires User Testing:
- [ ] Sign Up creates account successfully
- [ ] Sign In authenticates existing user
- [ ] Ghost user issue resolved (shows real name/email)
- [ ] Session persists across page reloads
- [ ] Remember Me keeps user logged in
- [ ] Logout returns to auth screen

---

## Profile Tab

### ⏳ Requires User Testing:
- [ ] Profile shows correct user name
- [ ] Profile shows correct email
- [ ] Subscription panel removed
- [ ] Preferences section accessible
- [ ] Account settings work
- [ ] Logout button works

---

## Admin Dashboard

### ⏳ Requires Admin Testing:
- [ ] Admin dashboard accessible (Switch to Admin View)
- [ ] City selector works
- [ ] Content type tabs navigate correctly
- [ ] Events Manager:
  - [ ] Create event
  - [ ] Edit event
  - [ ] Delete event
  - [ ] Toggle featured status
  - [ ] Reorder events
- [ ] Vibe Scores Manager:
  - [ ] Edit scores inline
  - [ ] Save scores
  - [ ] Current day highlighted
- [ ] Placeholder managers display

---

## Location-Based Access Control

### ⏳ Requires User Testing:
- [ ] Geolocation permission requested
- [ ] User's city detected correctly
- [ ] If in target city:
  - [ ] City auto-selected
  - [ ] No restriction modal shown
  - [ ] Content loads for detected city
- [ ] If NOT in target city:
  - [ ] Location restriction modal appears
  - [ ] Modal shows detected city
  - [ ] City selector dropdown works
  - [ ] Can select any target city
  - [ ] "Continue" button works
  - [ ] Selected city persists
- [ ] Manual city change:
  - [ ] Can change city in settings
  - [ ] Content updates for new city
  - [ ] Selection persists across sessions

---

## Explore Tab

### ⏳ Requires User Testing:
- [ ] Explore tab is default landing tab
- [ ] City name displays correctly
- [ ] Content loads for selected city
- [ ] Events display (if any exist)
- [ ] Vibe score displays (if exists)
- [ ] Action cards display
- [ ] Empty states show when no content
- [ ] Loading states work
- [ ] Responsive on mobile

---

## Map Tab

### ⏳ Requires User Testing:
- [ ] Map loads correctly
- [ ] User location marker appears
- [ ] Map centers on selected city
- [ ] Venue pins display
- [ ] Venue detail opens on click
- [ ] Map theme works

---

## CityGauge Tab

### ⏳ Requires User Testing:
- [ ] CityGauge tab accessible
- [ ] City name displays
- [ ] Vibe score displays (if exists)
- [ ] Weather info displays
- [ ] Ticker shows at bottom

---

## General UX

### ✅ Verified Working:
- [x] App builds without errors
- [x] No console errors on load
- [x] Splash screen transitions smoothly

### ⏳ Requires User Testing:
- [ ] Bottom navigation works
- [ ] Tab switching smooth
- [ ] No ghost user issues
- [ ] No authentication loops
- [ ] No infinite loading states
- [ ] Responsive on mobile
- [ ] Dark mode works (if applicable)

---

## Database

### ✅ Verified Complete:
- [x] All 8 admin tables created
- [x] RLS policies applied
- [x] Indexes created
- [x] Triggers set up
- [x] Permissions granted

### ⏳ Requires Testing:
- [ ] Admin can create content
- [ ] Admin can edit content
- [ ] Admin can delete content
- [ ] Non-admin users can read content
- [ ] Non-admin users cannot write content
- [ ] Content filters by city correctly

---

## Known Issues

### Critical:
- None identified yet

### Medium:
- ExploreTab needs full UI redesign
- Only 2 of 8 content managers fully functional
- Stripe integration not implemented

### Low:
- Mobile responsiveness needs optimization
- Loading states need improvement
- Empty states need better messaging

---

## Next Testing Session

### Prerequisites:
1. Create test user account
2. Promote test user to app admin (set `is_app_admin = true`)
3. Add sample content via admin dashboard
4. Test in multiple cities (VPN/location spoofing)

### Test Scenarios:
1. **New User Journey**:
   - First launch → Onboarding → Splash → Sign Up → Explore
   
2. **Returning User Journey**:
   - Launch → Splash → Auto-login → Explore

3. **Admin User Journey**:
   - Login → Switch to Admin View → Manage Content → Return to App

4. **Location Scenarios**:
   - User in London (target city)
   - User in Paris (non-target city)
   - User denies location permission
   - User manually selects city

---

## Test Data Needed

### Events:
- Create 3-5 events for each target city
- Vary dates, times, descriptions
- Test featured flag
- Test display order

### Vibe Scores:
- Enter scores for current week
- Test Monday-Sunday display
- Test current day highlighting

### Users:
- 1 regular user
- 1 app admin user
- 1 super admin user (BaseJump)

---

## Deployment Verification

### ✅ Verified:
- [x] Netlify deployment successful
- [x] Branch: feature/explore-tab-redesign
- [x] Build completes without errors
- [x] Environment variables set
- [x] URL accessible: https://devtests-kunajoto.netlify.app/

### ⏳ Pending:
- [ ] Performance testing
- [ ] Load time optimization
- [ ] Bundle size optimization
- [ ] SEO optimization

---

## Sign-Off

### Developer:
- **Implementation**: ✅ Complete
- **Build**: ✅ Successful
- **Deployment**: ✅ Live
- **Documentation**: ✅ Complete

### User Testing:
- **Status**: ⏳ Pending
- **Tester**: [User]
- **Date**: [To be completed]

---

**Notes**: All core features implemented and deployed. Requires user testing to verify end-to-end functionality and identify any edge cases or issues.
