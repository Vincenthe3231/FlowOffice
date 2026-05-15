# Implementation Plan: Bento Box Work Locations (LocationManager)

**File:** `src/features/attendance/components/LocationManager.tsx`  
**Goal:** Replace the simple list cards with a Bento-style `LocationCard` (status dot, name, badge, toggle, edit, address + geofence modules) using the app’s design tokens.

---

## Phase 1 — Revert (do this first if Bento is still applied)

1. **Restore imports**
   - Add back: `Card`, `CardContent` from `@/components/ui/card`, `Badge` from `@/components/ui/badge`.
   - In `lucide-react`: add `Pencil`, remove `Edit2` and `Target`.

2. **Remove the `LocationCard` component**
   - Delete the entire `function LocationCard({ ... }) { ... }` block (from the opening `function LocationCard` through the closing `);` of the outer `</div>` and `}`).

3. **Restore the list rendering**
   - In the `offices.map` section, replace the `<LocationCard ... />` usage with the original structure:
     - Wrap each item in `<Card key={office.id} className="shadow-card border-0">` and `<CardContent className="p-3 flex items-center gap-3">`.
     - Left: name + `Badge` (Active/Inactive), address (if present), "Radius: {office.radiusMeters}m".
     - Right: `Switch` (checked = office.isActive, onCheckedChange → toggleActive.mutate), `Button` (icon, ghost) with `Pencil` that calls `openEdit(office)`.
   - Use `space-y-2` on the list container (not `space-y-3`).

Result: Back to the pre–Bento layout (simple cards with Badge, Pencil, Switch).

---

## Phase 2 — Re-apply Bento design

### Step 1 — Imports

- **Add** `Edit2` and `Target` to the `lucide-react` import.
- **Remove** from this file’s imports: `Card`, `CardContent`, `Badge` (only if they are not used elsewhere in the file; they are not used in the new card UI).
- **Keep** `Pencil` only if the Add/Edit dialog still uses it; otherwise you can remove it and use `Edit2` in the card only.

### Step 2 — Add `LocationCard` component

- **Place:** After `emptyForm` and before `export function LocationManager`.
- **Props:**  
  `office: Office`  
  `onToggle: (id: string, checked: boolean) => void`  
  `onEdit: (office: Office) => void`
- **Structure:**
  - **Outer:** One wrapper `div` with:
    - `bg-card`, `rounded-2xl`, `p-5`, `border`, `transition-all duration-300`.
    - Conditional classes: if `office.isActive` then `hover:border-primary/40 hover:shadow-md`, else `opacity-80`; border color `border-border`.
  - **Top row (flex, justify-between, responsive):**
    - **Left:** Status dot (small circle: active = `bg-primary` + glow, inactive = `bg-muted-foreground/30`), then `office.name` (bold, `text-foreground`), then Active/Inactive badge (uppercase, small; active = `bg-primary/10 text-primary`, inactive = `bg-muted text-muted-foreground`).
    - **Right:** `Switch` (checked = office.isActive, onCheckedChange → `onToggle(office.id, checked)`), vertical divider (`w-px h-6 bg-border`), then icon `Button` (Edit2) that calls `onEdit(office)`.
  - **Bottom (grid):**
    - **Row:** `grid grid-cols-1 md:grid-cols-4 gap-3`.
    - **Address module (md:col-span-3):** Container with `bg-muted/40`, `rounded-xl`, `p-3.5`, `border border-border/50`, `group-hover:bg-primary/5`. Inside: `MapPin` icon, then `office.address ?? "No address provided"`.
    - **Geofence module (md:col-span-1):** Same container style. Inside: `Target` icon, label "GEOFENCE" (uppercase, small, muted), then `office.radiusMeters` + "m".
- **Icons:** Use `Edit2` for the edit button; use design tokens for colors (e.g. `text-muted-foreground`, `hover:text-primary`, `hover:bg-primary/10`) so theme/dark mode stay consistent.

### Step 3 — Use `LocationCard` in the list

- In the same place where you currently have `offices.map(...)`:
  - Replace the `<Card>...</Card>` (or current card) with:
    - `offices.map((office) => (<LocationCard key={office.id} office={office} onToggle={(id, checked) => toggleActive.mutate({ id, is_active: checked })} onEdit={openEdit} />))`.
  - List container: use `space-y-3` for spacing between cards.

### Step 4 — Cleanup

- Remove any unused imports (`Card`, `CardContent`, `Badge` if no longer used; `Pencil` if only the card used it and you switched to Edit2).
- Run lint and fix any reported issues.

### Step 5 — Verification

- **Work Locations page** (`/dashboard/settings/locations`): Only the LocationManager block; cards should be Bento style.
- **Attendance page** (“Manage Locations”): Same Bento cards.
- Add location, edit location, toggle active: behavior unchanged; dialog and geocoding unchanged.
- If the app uses `class`-based dark mode on `html`, confirm cards look correct in both themes (tokens like `bg-card`, `text-foreground`, `border-border`, `bg-primary` should follow theme).

---

## File reference

- **LocationManager:** `src/features/attendance/components/LocationManager.tsx`
- **Offices type:** `Office` from `@/shared/lib/api-client/offices` (id, name, address, latitude, longitude, radiusMeters, isActive).
- **Hooks:** `useOfficeManagement()` (offices, isLoading, addOffice, updateOffice, toggleActive); `openEdit(office)` opens the edit dialog.

---

## Summary checklist

- [ ] Revert: restore Card/CardContent/Badge/Pencil list if still on Bento.
- [ ] Add Edit2, Target; remove Card, CardContent, Badge (and Pencil if unused).
- [ ] Add `LocationCard` with header (dot, name, badge, Switch, Edit2) and bento grid (address + geofence).
- [ ] Replace list content with `<LocationCard ... onToggle={...} onEdit={openEdit} />`.
- [ ] Lint and test Add/Edit/toggle on both Work Locations and Attendance.
