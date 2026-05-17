# Profile Page Design Specification

## Purpose
The profile page (planned: `/profile`) is a lightweight page where users can view and edit their personal information. Unlike settings (which covers account configuration), the profile page focuses on identity: display name, avatar, and account metadata. It should feel personal and warm while maintaining the professional dark-theme aesthetic.

**User mindset:** May want to personalize their account, verify their identity, or check account creation details. This is a low-frequency page — users might visit once to set a name and never return. Keep it simple and satisfying.

---

## Layout Structure

### Section Order
1. **Page header** — title "Profile" with subtle description
2. **Avatar section** — large avatar display with edit/upload option
3. **Identity section** — display name, email (read-only), member since
4. **Activity summary** — receipt count, active deadlines, account status
5. **Danger zone** — (optional) delete account link → settings page

### Spacing
- Root container: `max-w-2xl mx-auto px-6 py-8 md:px-8`
- Section gap: `gap-8` between major sections
- Internal card padding: `p-6`
- Field gap: `gap-4` within forms

### Grids
- Single column layout — profile is a reading/editing experience, not a dashboard
- Avatar + name could be side-by-side on desktop

### Containers
- Root: `max-w-2xl` — narrower than settings, more focused
- Cards for each logical section
- No sidebar needed

### Responsive Adaptations
- **Mobile (<640px):** Single column, avatar centered, fields full-width
- **Tablet/Desktop (640px+):** Avatar + name side-by-side, rest single column
- **Ultrawide:** Content centered within `max-w-2xl`

---

## Visual Direction

### Aesthetic Tone
Personal, warm, minimal. The profile page is the most "human" page in the application. It should feel like a personal space within the professional tool. Slightly more generous spacing than other pages to convey that this is about the person, not the data.

### Visual Density
Very low. Profile information is sparse by nature — a name, an email, a join date. Don't try to fill the space. Let the emptiness convey calm and focus on the individual.

### Typography Emphasis
- **Display name:** `text-2xl font-semibold` — prominent, personal
- **Email:** `text-sm text-text-secondary` — subordinate identifier
- **Labels:** `text-sm font-medium text-text-secondary` — subtle
- **Member since:** `text-xs text-text-muted` — metadata, not emphasized
- **Stats:** `font-mono text-lg font-semibold` — receipt counts in JetBrains Mono

### Use of Whitespace
- Generous vertical spacing between sections (`gap-8`)
- Avatar has breathing room — not crammed against name
- The page should feel "light" despite the dark background
- Empty space around the profile conveys that the user is the focus

### Visual Focus Points
1. **Avatar** — the most personal element, largest visual element
2. **Display name** — the user's identity in the app
3. **Activity stats** — subtle but present, connects profile to usage

---

## Components

### shadcn/ui Components to Use
- **Card** — section containers
- **Avatar** (Radix) — user avatar with fallback initials
- **Button** — `variant="default"` for save, `variant="secondary"` for cancel, `variant="ghost"` for avatar edit
- **Input** — display name field
- **Skeleton** — loading state for avatar

### Customization
- Avatar: large size (80-96px), rounded-full, with subtle border
- Avatar edit: ghost button overlay on hover — camera icon
- Display name: inline editing with edit icon button
- Email: read-only display, not an input
- Member since: formatted date, not editable
- Stats: compact stat cards or a simple list

### Minimal vs Dense
**Minimal.** Profile has very little data. Don't invent fields to fill space. The emptiness is the luxury.

---

## Responsiveness

### Mobile (<640px)
- Single column
- Avatar centered, large
- Name centered below avatar
- Fields full-width
- `px-6` padding

### Tablet (640-1024px)
- Avatar + name side-by-side
- Rest single column
- `max-w-2xl` constraint

### Desktop (1024px+)
- Same as tablet
- Content centered, generous whitespace

### Ultrawide
- Content centered within `max-w-2xl`

### Touch Ergonomics
- Avatar edit button needs adequate touch area
- Name edit button clearly tappable
- No hover-dependent interactions for critical actions

---

## Motion

### Hover Effects
- **Avatar:** Subtle overlay with camera icon on hover (desktop)
- **Edit buttons:** Standard button hover
- **Cards:** Standard card hover (subtle lift)

### Transitions
- Avatar hover overlay: fade in/out, 150ms
- Edit mode: smooth transition between display and input
- Save confirmation: toast animation

### Page Animations
None. Static render.

### Loading Interactions
- Avatar: skeleton circle while loading
- Name: skeleton text while loading
- Stats: skeleton cards while loading
- Save: button shows spinner + "Saving..."

### Modal Behavior
- Avatar upload: could use a Dialog or inline file input
- No other modals needed

---

## Premium UX Rules

### Reduce Cognitive Load
- **Minimal fields** — name and avatar only (email is read-only)
- **No settings crossover** — account settings live in /settings, not here
- **Clear read-only vs editable distinction** — email is clearly display-only
- **No profile completion percentage** — not a social network

### Guide User Attention
- Avatar is the visual anchor — largest, most personal element
- Name is the primary editable field
- Stats provide subtle context without demanding action
- No "Edit Profile" mode toggle — individual fields are editable inline

### Luxury SaaS Feel
- Profile that feels personal, not like a database record
- The avatar makes the tool feel inhabited, not empty
- Generous spacing conveys that the user matters
- No gamification, no "Profile strength" meter

### Visual Calmness
- No real-time validation
- No "Changes unsaved" anxiety — explicit save per field
- No activity feed or recent actions (belongs in dashboard)
- No social features (followers, sharing, public profile)

### Polished Interactions
- Avatar upload with preview before save
- Name edit: click to edit, enter to save, escape to cancel
- Smooth transitions between display and edit modes
- Toast confirms every change

---

## Anti-Patterns

### DO NOT:
- ❌ Add a "Bio" or "About me" textarea (not a social network)
- ❌ Include social media links
- ❌ Show a "Profile viewed X times" counter
- ❌ Add a "Public profile" toggle
- ❌ Include a "Recent activity" feed
- ❌ Add a "Badges" or "Achievements" section
- ❌ Show "Account level" or "Tier" (unless there's a pricing model)
- ❌ Include a "Referral link" or "Invite friends"
- ❌ Add a profile completion progress bar
- ❌ Use a cover image / banner image
- ❌ Show "Last active" or online status
- ❌ Include a "Connected accounts" section (belongs in settings)
- ❌ Add a "Download my data" button (belongs in settings)
- ❌ Show the user's API usage or rate limits
- ❌ Add a theme picker (app is dark-only)

---

## Inspiration References

- **Linear** — Clean profile, minimal fields, avatar-focused
- **Apple** — Apple ID profile: simple, personal, trustworthy
- **Stripe** — User profile: professional, minimal, clear
- **Notion** — Account settings: compact, focused, no fluff
- **GitHub** — Public profile inspiration for layout (but much simpler)
