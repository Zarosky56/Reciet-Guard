# Receipt Guardian — Premium UI Redesign Plan

## Design goal

Make Receipt Guardian feel like a premium financial-safety command center, not a basic CRUD dashboard. The product should feel calm, expensive, trustworthy, and urgent only when action is required.

## Brand feeling

- **Mood:** private banking meets modern AI assistant.
- **Keywords:** premium, protected, calm, precise, confident, intelligent, polished.
- **Avoid:** generic SaaS cards, flat gray panels, crowded forms, weak contrast, boring empty states, and developer-demo styling.

## Visual direction

### Color system

- **Background:** deep obsidian gradient instead of flat black.
- **Surfaces:** layered glass panels with subtle border highlights.
- **Primary accent:** electric blue or sapphire for AI and primary actions.
- **Urgency accents:** emerald for safe, amber for approaching, red/coral for urgent.
- **Premium accent:** restrained champagne/gold used only for value, trust, or premium polish.

### Texture and depth

- **Hero glow:** radial blue and violet gradients behind the main dashboard preview.
- **Cards:** glassmorphism with translucent surfaces, soft inner border, and subtle hover lift.
- **Dividers:** hairline borders with low opacity.
- **Shadows:** layered shadows, not heavy drop shadows.
- **Noise:** optional very subtle background grain for luxury texture.

### Typography

- **Headlines:** large, confident, tight tracking, strong hierarchy.
- **Body:** calm, readable, generous line height.
- **Numbers:** mono or tabular numerals for money, days remaining, and deadlines.
- **Labels:** uppercase micro-labels only for analytics and status chips.

## Landing page redesign

### Above the fold

- **Navigation:** premium logo lockup, compact links, primary CTA.
- **Hero headline:** "Your return windows, protected by AI." or "Turn every receipt into a protected deadline."
- **Hero subtext:** emphasize financial protection, AI extraction, and no spreadsheet work.
- **Primary CTA:** "Start protecting receipts".
- **Secondary CTA:** "View dashboard preview".
- **Trust rail:** Gmail import, AI extraction, Supabase-secured auth, reminder emails.
- **Dashboard mockup:** show premium mini-dashboard with money at risk, expiring receipts, and receipt cards.

### Social proof and value sections

- **Problem section:** missed return windows, forgotten warranties, buried emails.
- **Solution section:** forward email, AI extracts, dashboard prioritizes, reminder protects.
- **Premium proof cards:** privacy-first, editable AI results, duplicate protection, deadline alerts.
- **Final CTA:** luxury full-width gradient panel.

## Dashboard redesign

### Header

- **Left:** premium brand badge and user context.
- **Center:** search command style input.
- **Right:** import button, add receipt button, logout menu.
- **State indicators:** Gmail configured, AI online, reminders enabled.

### Executive summary row

- **Money protected:** total active receipt value.
- **Expiring soon:** count within 3 days.
- **Return windows:** active count.
- **AI confidence:** average confidence or review count.

### Priority action area

- **Urgent receipts panel:** top 3 receipts requiring action.
- **Recommended action copy:** "Return by Friday", "Review AI extraction", "Warranty saved".
- **Quick actions:** mark returned, edit, keep, delete.

### Receipt grid

- **Card hierarchy:** item first, store second, price and deadline prominent.
- **Urgency styling:** edge glow or top stripe based on urgency.
- **Countdown:** `3 days left`, `Due today`, or `Expired`.
- **AI confidence:** small chip when imported through AI.
- **Status controls:** use segmented control or dropdown to reduce button clutter.

### Manual entry and AI extraction

- **AI extraction panel:** premium drop zone for pasted email with clear privacy note.
- **Review state:** show extracted fields in a confirmation panel before saving.
- **Manual form:** compact, polished, field grouping: item, money, dates, status.
- **Error states:** inline validation with human language.

## Component upgrades

- **Button:** add gradient primary, premium secondary, danger confirmation pattern.
- **Card:** add `premium`, `urgent`, and `glass` variants.
- **Input:** add focus ring glow, icon support, and validation state.
- **Badge:** add urgency, confidence, status, and provider variants.
- **Toast:** use concise, confidence-building messages.
- **Skeletons:** add loading states for dashboard and receipt cards.
- **Dialog:** use confirmation dialogs for delete and imported receipt review.

## Motion direction

- **Use motion sparingly:** premium means intentional, not flashy.
- **Allowed:** soft fade-in, hover lift, urgency pulse for due-soon only, copied-address microinteraction.
- **Avoid:** bouncing, excessive gradients, constant animations, layout jumps.

## Accessibility requirements

- **Contrast:** all text must meet WCAG AA.
- **Keyboard:** all receipt actions, forms, search, and dialogs must work with keyboard.
- **Focus:** visible and premium focus rings.
- **Reduced motion:** respect `prefers-reduced-motion`.
- **Screen readers:** status changes should be understandable without color.

## Implementation sequence

1. **Design tokens:** upgrade `globals.css` and `tailwind.config.ts` with premium gradients, shadows, radii, and semantic colors.
2. **UI primitives:** upgrade Button, Card, Input, Badge, Dialog, and Toast styling.
3. **Landing page:** build premium hero, mockup, proof sections, and CTA.
4. **Dashboard shell:** redesign header, summary cards, and main layout.
5. **Receipt cards:** simplify actions and add urgency-based hierarchy.
6. **Forms:** redesign extraction and manual receipt flows.
7. **QA pass:** check mobile, tablet, desktop, keyboard, contrast, and dummy data.

## Acceptance checklist

- **Premium first impression:** homepage looks like a polished product, not a template.
- **Dashboard clarity:** user understands what needs action within 5 seconds.
- **Mobile quality:** dashboard remains usable on a small phone.
- **Visual consistency:** no mismatched radius, border, shadow, or button styles.
- **No clutter:** receipt cards show primary actions clearly without overwhelming users.
- **Trust:** AI and Gmail behavior feels transparent and controllable.
