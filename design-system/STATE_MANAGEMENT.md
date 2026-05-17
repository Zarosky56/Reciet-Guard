# STATE_MANAGEMENT.md — Client State, Server State & Data Flow Governance

> **Role:** This document defines how data flows through Receipt Guardian's frontend — from server-fetched initial state through client-side mutations and back. It governs state management patterns, prevents state-related bugs, and ensures the UI always reflects reality.

> **Authority:** State management decisions affect both UX and performance. This document bridges IMPLEMENTATION.md (workflow) and PERFORMANCE.md (rendering strategy).

---

## 1. Purpose

State management governance exists because:
- Receipt Guardian mixes server-rendered pages with client-side interactivity
- AI agents default to over-engineering state (Redux, Zustand, React Query) when simpler patterns suffice
- Incorrect state management causes stale data, race conditions, and UI inconsistencies
- The app's data model is simple — the state management should match
- Premium UX requires instant feedback while maintaining data integrity

This document answers: "Where does this data live, and how does it change?"

---

## 2. State Philosophy

### Core Beliefs
1. **Server is the source of truth** — Client state is a cache of server state, not an independent source.
2. **Simplicity over abstraction** — `useState` + `fetch` is sufficient. No state management libraries.
3. **Optimistic where safe** — Status changes can be optimistic. Financial data changes cannot.
4. **Explicit over magical** — No auto-syncing, no real-time subscriptions, no background polling.
5. **Minimal client state** — If the server can compute it, don't store it on the client.

### Why No State Management Library
Receipt Guardian's state needs are simple:
- One list of receipts (fetched on page load, mutated via API)
- One form state (controlled inputs)
- One search filter (derived from receipt list)
- A few boolean flags (loading, editing)

This does not justify Redux, Zustand, Jotai, or React Query. The complexity cost of these libraries exceeds their benefit for this use case.

---

## 3. State Categories

### Server State (Authoritative)
Data that lives in the database and is fetched on page load.

| Data | Source | Fetch Strategy | Staleness Tolerance |
|---|---|---|---|
| User session | Supabase Auth | Server Component (SSR) | None — always fresh |
| User profile | `profiles` table | Server Component (SSR) | Low — fetched per request |
| Receipt list | `receipts` table | Server Component → prop | Medium — fresh on page load |
| Forwarding address | Profile or env | Server Component → prop | High — rarely changes |

**Rules:**
- Server state is fetched in Server Components (page.tsx files)
- Passed to Client Components as props (`initialReceipts`, `forwardingAddress`)
- Never fetched in `useEffect` on initial load — that's what Server Components are for
- Refetched only after mutations that affect the list (e.g., Gmail check imports new receipts)

### Client State (Ephemeral)
Data that exists only in the browser during the current session.

| Data | Hook | Lifetime | Reset Trigger |
|---|---|---|---|
| Receipt list (local copy) | `useState` | Page session | Page reload |
| Search query | `useState` | Page session | User clears |
| Form values | `useState` | Until submit/cancel | Submit success or cancel |
| Editing receipt ID | `useState` | Until submit/cancel | Submit success or cancel |
| Email text (extraction) | `useState` | Until extraction | Not auto-cleared |
| Pending state | `useTransition` | During async operation | Operation completes |

**Rules:**
- Client state is initialized from server props
- Client state is updated optimistically after successful mutations
- Client state is never persisted to localStorage (no offline support needed)
- Client state resets on page navigation (Next.js unmounts the component)

### Derived State (Computed)
Data computed from other state — never stored independently.

| Data | Derived From | Computation | Memoized? |
|---|---|---|---|
| Filtered receipts | receipts + search | `.filter()` by name/store | Yes (`useMemo`) |
| Stats (total, active, etc.) | receipts | `.filter()` + `.reduce()` | Yes (`useMemo`) |
| Form validity | form values | Check required fields | No (computed on submit) |

**Rules:**
- Derived state uses `useMemo` when the computation is non-trivial
- Never store derived state in `useState` — it will desync from its source
- Recomputation is triggered automatically when dependencies change
- No manual "recalculate" triggers needed

---

## 4. Data Flow Architecture

### Page Load Flow
```
1. Browser requests /dashboard
2. Next.js Server Component executes:
   a. requireUser() → validates session
   b. supabase.from("receipts").select("*") → fetches data
   c. mapReceipts(data) → transforms to ReceiptWithUrgency[]
3. Server renders HTML with data embedded
4. Client hydrates:
   a. ReceiptDashboard receives initialReceipts as prop
   b. useState(initialReceipts) creates local copy
   c. useMemo computes filtered list and stats
5. Page is interactive
```

### Mutation Flow (Create/Update)
```
1. User fills form and clicks submit
2. startTransition(async () => { ... })
3. fetch("/api/receipts", { method: "POST", body: ... })
4. Server validates, inserts/updates, returns updated receipt
5. On success:
   a. Update local receipts state (add or replace)
   b. Sort by days_remaining
   c. Show success toast
   d. Reset form
6. On error:
   a. Show error toast
   b. Form retains values (user can retry)
```

### Mutation Flow (Delete)
```
1. User clicks delete button
2. startTransition(async () => { ... })
3. fetch(`/api/receipts/${id}`, { method: "DELETE" })
4. On success:
   a. Remove from local receipts state
   b. Show success toast
5. On error:
   a. Show error toast
   b. Receipt remains in list (no optimistic removal)
```

### Mutation Flow (Status Change)
```
1. User clicks status button
2. startTransition(async () => { ... })
3. fetch(`/api/receipts/${id}`, { method: "PATCH", body: { status } })
4. On success:
   a. Replace receipt in local state with server response
   b. (No toast needed — visual change is sufficient feedback)
   c. Actually, toast IS shown per current implementation
5. On error:
   a. Show error toast
   b. Status reverts (no optimistic update for status)
```

### Gmail Check Flow
```
1. User clicks "Check Inbox Now"
2. startTransition(async () => { ... })
3. fetch("/api/gmail/check-now", { method: "POST" })
4. Server checks Gmail, processes emails, creates receipts
5. On success with new receipts:
   a. Refetch full receipt list (GET /api/receipts)
   b. Replace local state with fresh data
   c. Show success toast with count
6. On success with no new receipts:
   a. Show informational toast
   b. No state change
7. On error:
   a. Show error toast
```

---

## 5. State Update Patterns

### Pattern: Optimistic List Update
```typescript
// After successful create/update
setReceipts((current) => {
  const withoutUpdated = current.filter((r) => r.id !== updated.id);
  return [...withoutUpdated, updated].sort((a, b) => {
    const left = a.days_remaining ?? 9999;
    const right = b.days_remaining ?? 9999;
    return left - right;
  });
});
```

**Rules:**
- Always sort after update — maintains consistent order
- Use functional update (`setReceipts((current) => ...)`) — avoids stale closure
- Remove then re-add — handles both create (new ID) and update (existing ID)
- Sort by `days_remaining` — most urgent first

### Pattern: Optimistic Removal
```typescript
// After successful delete
setReceipts((current) => current.filter((r) => r.id !== receipt.id));
```

**Rules:**
- Remove only after server confirms success
- No undo mechanism in UI (user can re-create)
- Toast confirms the action

### Pattern: Full List Refresh
```typescript
// After Gmail check imports new receipts
const response = await fetch("/api/receipts");
const data = await response.json();
if (response.ok && Array.isArray(data.receipts)) {
  setReceipts(data.receipts);
}
```

**Rules:**
- Full refresh only when bulk changes occur (Gmail import)
- Never full refresh after single-item mutations (wasteful)
- Validate response shape before updating state

### Pattern: Form State Management
```typescript
const [form, setForm] = useState<ReceiptFormState>(emptyForm);
const [editingId, setEditingId] = useState<string | null>(null);

// Set field
function setField<K extends keyof ReceiptFormState>(key: K, value: ReceiptFormState[K]) {
  setForm((current) => ({ ...current, [key]: value }));
}

// Reset
function resetForm() {
  setEditingId(null);
  setForm(emptyForm);
}

// Pre-fill from existing receipt
function editReceipt(receipt: ReceiptWithUrgency) {
  setEditingId(receipt.id);
  setForm(toForm(receipt));
}
```

**Rules:**
- Form state is a flat object — no nested state
- `editingId` determines create vs. update mode
- Reset clears both form and editing state
- Pre-fill transforms receipt data to form shape (strings for all fields)

---

## 6. Async Operation Management

### useTransition Pattern
```typescript
const [isPending, startTransition] = useTransition();

function handleAction() {
  startTransition(async () => {
    // async work here
  });
}
```

**Why useTransition:**
- Provides `isPending` boolean for loading states
- Marks the update as non-urgent — React can batch
- No manual `setLoading(true)` / `setLoading(false)` needed
- Handles errors gracefully (no unhandled promise rejections)

**Rules:**
- All mutations use `startTransition`
- `isPending` disables buttons during operations
- Multiple operations share the same `isPending` — only one operation at a time
- No concurrent mutations — the UI prevents it via disabled state

### Error Handling
```typescript
startTransition(async () => {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    toast.error(json?.error?.message ?? "Something went wrong.");
    return; // Early return — no state update
  }

  // Success path — update state
});
```

**Rules:**
- Always check `response.ok` before updating state
- Always provide a fallback error message
- Use `toast.error()` for all error communication
- Never throw in `startTransition` — handle errors inline
- `.catch(() => null)` on JSON parsing — handles non-JSON error responses

### Race Condition Prevention
- `isPending` disables all action buttons — prevents concurrent mutations
- No debouncing on search (it's synchronous client-side filtering)
- No abort controllers needed (operations are short, UI prevents overlap)
- If a user navigates away during a pending operation, React unmounts — no cleanup needed

---

## 7. State Initialization

### From Server Props
```typescript
// Server Component (page.tsx)
const receipts = mapReceipts(data);
return <ReceiptDashboard initialReceipts={receipts} />;

// Client Component
export function ReceiptDashboard({ initialReceipts }: Props) {
  const [receipts, setReceipts] = useState(initialReceipts);
  // ...
}
```

**Rules:**
- Server Component fetches and transforms data
- Client Component receives transformed data as prop
- `useState(initialProp)` — initial value used only on first render
- If props change (e.g., after navigation), component remounts with new initial value

### Empty State Initialization
```typescript
const emptyForm: ReceiptFormState = {
  store_name: "",
  item_name: "",
  price: "",
  currency: "USD",
  purchase_date: "",
  return_deadline: "",
  warranty_deadline: "",
  status: "active",
};
```

**Rules:**
- Define empty state as a constant outside the component
- All string fields default to `""` (not `null` or `undefined`)
- Sensible defaults where applicable (`currency: "USD"`, `status: "active"`)
- Empty state is the reset target after form submission

---

## 8. Type Safety

### Receipt Types
```typescript
// types/receipt.ts
export type ReceiptStatus = "active" | "returned" | "kept" | "expired";

export interface ReceiptWithUrgency {
  id: string;
  user_id: string;
  store_name: string | null;
  item_name: string | null;
  price: number | null;
  currency: string | null;
  purchase_date: string | null;
  return_deadline: string | null;
  warranty_deadline: string | null;
  status: ReceiptStatus;
  urgency: "green" | "yellow" | "red" | "none";
  days_remaining: number | null;
  // ... other fields
}
```

**Rules:**
- All nullable database fields are `| null` in TypeScript (not `undefined`)
- Status is a union type — exhaustive checking in switch statements
- Urgency is computed server-side and included in the type
- Form state uses `string` for all fields (even price) — conversion happens on submit

### API Response Types
- API responses are not formally typed on the client (using `.json()` which returns `any`)
- Type assertions (`as ReceiptWithUrgency`) are used after validation
- Server-side Zod validation ensures data shape — client trusts the server

---

## 9. State Anti-Patterns

### DO NOT:
- ❌ Use `useEffect` to fetch initial data — Server Components handle this
- ❌ Store derived state in `useState` — use `useMemo`
- ❌ Use `useReducer` for simple state — `useState` is sufficient here
- ❌ Add a state management library (Redux, Zustand, Jotai) — overkill
- ❌ Use React Query/SWR — manual fetch is simpler for this use case
- ❌ Store UI state in URL params (except auth redirects) — unnecessary complexity
- ❌ Use `useRef` to store mutable state that affects rendering — use `useState`
- ❌ Sync state between components via shared refs — lift state up instead
- ❌ Use `localStorage` for state persistence — no offline requirement
- ❌ Poll the server for updates — user controls refresh via "Check Inbox Now"
- ❌ Use WebSockets or Server-Sent Events — no real-time requirement
- ❌ Create context providers for state that only one component tree needs
- ❌ Memoize everything — only memoize expensive computations
- ❌ Use `useCallback` on every handler — only when passing to memoized children

---

## 10. Future State Considerations

### When to Reconsider This Architecture
- **Multiple pages sharing receipt state** → Consider React Context or URL-based state
- **Real-time collaboration** → Consider WebSockets + optimistic updates
- **Offline support** → Consider service workers + IndexedDB
- **Complex form workflows** → Consider react-hook-form
- **Paginated data** → Consider cursor-based pagination with local cache

### Current Architecture Limits
- Receipt list is loaded entirely on page load — works for <1000 receipts
- No cross-page state sharing — navigating away loses client state
- No undo/redo — deleted receipts cannot be recovered from client state
- Single `isPending` flag — can't show per-item loading states

### Scaling Triggers
| Trigger | Current Approach | Future Approach |
|---|---|---|
| >500 receipts | Load all, filter client-side | Server-side pagination |
| Multiple data pages | Independent state per page | Shared context or URL state |
| Real-time updates | Manual refresh button | WebSocket subscription |
| Complex forms | Controlled inputs | react-hook-form |
| Offline access | None | Service worker + sync |

---

## Document Maintenance

### When to Update STATE_MANAGEMENT.md
- New state category introduced (e.g., notification preferences)
- Data flow pattern changes (e.g., adding real-time updates)
- New async operation pattern needed
- State-related bug reveals a missing rule

### When NOT to Update
- Adding a new field to existing form state
- Minor refactoring of state update logic
- Adding a new API endpoint that follows existing patterns
