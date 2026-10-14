# Crackers King — Design System & Component Library

## 1. Centralized Design Token Architecture

### Color Palette
- **Brand Blue Sequence**:
  - `brand-50` (`#F0F7FF`): Soft light background tint
  - `brand-100` (`#E0EFFE`): Light sky blue accent
  - `brand-200` (`#BAE0FD`): Sky blue surface highlight
  - `brand-300` (`#7CC5FC`): Sky blue
  - `brand-400` (`#36A7F9`): Vibrant sky blue
  - `brand-500` (`#0C89EB`): Core brand vibrant blue
  - `brand-600` (`#006BCE`): Deep electric blue
  - `brand-700` (`#0055A7`): Royal blue
  - `brand-800` (`#044889`): Deep royal blue
  - `brand-900` (`#0A3B70`): Deep navy blue
  - `brand-950` (`#061A30`): Midnight navy (Dark theme base)
- **Surfaces**:
  - Light mode: Pure white (`#FFFFFF`) and slate background (`#F8FAFC`)
  - Dark mode: Midnight navy (`#0B132B`) and elevated surfaces (`#131C38`)

### Centralized Gradients
- `var(--gradient-soft)`: Soft light blue gradient
- `var(--gradient-sky)`: Sky blue transition gradient
- `var(--gradient-vibrant)`: Vibrant blue accent gradient
- `var(--gradient-royal)`: Royal blue gradient
- `var(--gradient-deep)`: Deep navy gradient
- `var(--gradient-hero)`: Hero brand gradient
- `.bg-gradient-ambient-slow`: Slow ambient background animation helper class

### Typography Hierarchy
- `.text-display`: 2.25rem - 3rem bold header
- `.text-heading-xl`: 1.75rem page heading
- `.text-heading-lg`: 1.375rem section heading
- `.text-heading-md`: 1.125rem card title
- Subtitles, body (`text-sm`/`text-base`), captions (`text-xs`), and code tags (`text-[10px]`)

---

## 2. Reusable Generic UI Primitives (`src/components/ui/`)

| Component | Description |
| :--- | :--- |
| `Button` | Primary, Secondary, Outline, Ghost, Destructive, Icon with loading spinner & disabled states |
| `IconButton` | Dedicated touch-friendly icon button control |
| `Input` | Form text input with label, error message, helper text, and icon slots |
| `SearchInput` | Dedicated search field primitive with instant clear button |
| `Select` | Form select dropdown control |
| `Checkbox` | Styled custom checkbox control |
| `Toggle` | Custom switch toggle switch primitive |
| `Badge` | Status highlight badge (brand, success, warning, danger, neutral) |
| `Pill` | Interactive filter chip/pill |
| `Card` | Surface card with optional glass background, glow effect, and hover interaction |
| `Modal` | Centered desktop/responsive dialog modal with backdrop blur & focus trap |
| `BottomSheet` | Mobile-first bottom sheet drawer sliding up with handle indicator |
| `Toast` & `ToastContext` | Floating notification provider (Success, Error, Warning, Info) |
| `Tooltip` | Hover tooltip primitive |
| `Dropdown` | Action menu dropdown primitive |
| `Divider` | Horizontal & vertical divider with optional text label |
| `Avatar` | Initials & image user avatar placeholder |
| `LoadingSpinner` | Animated spinner indicator |
| `SkeletonLoader` | Pulse skeleton placeholders (text, card, avatar, image) |
| `EmptyState` | Reusable empty data placeholder card |
| `ErrorState` | Reusable error fallback card with retry action button |
| `ConfirmationDialog` | Pre-styled confirmation/warning modal dialog |

---

## 3. Application Shells

- **Customer Shell (`src/customer/layouts/CustomerLayout.tsx`)**:
  - Sticky glass header, top notice bar, theme toggle, mobile bottom bar foundation.
- **Admin Shell (`src/admin/layouts/AdminLayout.tsx`)**:
  - Desktop sidebar, mobile navigation header, user profile summary, theme toggle.
