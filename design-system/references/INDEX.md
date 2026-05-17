# Reference Screenshots Index

> Visual references organized by design context. Study the principles — spacing, restraint, hierarchy — don't copy pixel-for-pixel.

---

## Folder Structure

```
references/
├── auth/                  # Login & signup page references
│   ├── linear-login.png   # Dark auth, single card, no distractions
│   ├── notion-login.png   # Simple email form, minimal friction
│   └── stripe-login.png   # Centered card, dark void, minimal fields
├── dashboard/             # Data display & card layout references
│   ├── linear-issues.png  # Dark theme, minimal chrome, clean data rows
│   ├── raycast-store.png  # Card grid, dark theme, consistent spacing
│   ├── stripe-payments.png # Data density that feels calm
│   ├── vercel-dashboard.png # Project list, subtle borders, card layout
│   └── vercel-deployment.png # Monospace data, clean hierarchy
├── landing/               # Public-facing page references
├── motion/                # Animation & interaction references
├── navigation/            # Nav patterns & chrome references
│   └── arc-browser.png    # Chrome that disappears, content-first
├── settings/              # Settings & configuration page references
│   ├── apple-settings.png # Clean grouping, generous whitespace, clear hierarchy
│   └── linear-settings.png # Grouped sections, clear labels, dark theme
├── tabels/                # Table & data grid references
└── typography/            # Type scale & hierarchy references
```

---

## How Each Folder Maps to Our Pages

| Folder | Receipt Guardian Page | What to Study |
|---|---|---|
| `auth/` | `/login`, `/signup` | Centered card isolation, dark void, field spacing |
| `dashboard/` | `/dashboard` | Card grids, stat displays, data density balance |
| `landing/` | `/` | Hero restraint, proof points, CTA hierarchy |
| `navigation/` | All pages | Minimal chrome, content-first philosophy |
| `settings/` | `/settings` (planned) | Section grouping, form organization, sidebar nav |
| `tabels/` | Future data views | Row density, column alignment, sort indicators |
| `typography/` | All pages | Type scale consistency, weight hierarchy |
| `motion/` | All pages | Subtle transitions, hover states, loading patterns |

---

## Usage Guidelines

### During Implementation
1. Open the relevant subfolder before starting a page redesign
2. Note the *spacing rhythm* — how much whitespace surrounds elements
3. Note the *color restraint* — how few colors are used
4. Note the *typography hierarchy* — how size/weight creates importance
5. Apply these observations through our token system (never copy exact values)

### During Review
- Compare your page against 2-3 references from the relevant folder
- Ask: "Does our page feel as calm and intentional as these?"
- If not, the issue is usually: too many elements, inconsistent spacing, or too many colors

### What These References Prove
- Dark theme + minimal decoration = premium (not boring)
- Generous whitespace = luxury (not empty)
- One accent color = focused (not limited)
- Restrained motion = intentional (not static)

---

## Still Needed (Capture When Available)

| Folder | Missing References | Suggested Sources |
|---|---|---|
| `landing/` | Dark SaaS landing pages | Linear.app, Vercel.com, Raycast.com |
| `motion/` | Subtle hover/transition examples | Linear, Stripe (inspect with DevTools) |
| `typography/` | Type scale examples | Apple.com, Stripe docs, Linear |
| `tabels/` | Clean data table examples | Stripe dashboard, Linear project views |
