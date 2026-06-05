---
name: Sovereign Institutional Design
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#3f4945'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#707975'
  outline-variant: '#bfc9c4'
  surface-tint: '#29695b'
  primary: '#00342b'
  on-primary: '#ffffff'
  primary-container: '#004d40'
  on-primary-container: '#7ebdac'
  inverse-primary: '#94d3c1'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#00342d'
  on-tertiary: '#ffffff'
  tertiary-container: '#004d44'
  on-tertiary-container: '#64c1b0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#afefdd'
  primary-fixed-dim: '#94d3c1'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#065043'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#97f3e2'
  tertiary-fixed-dim: '#7ad7c6'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005047'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
  surface-background: '#F4F7F6'
  surface-card: '#FFFFFF'
  gold-muted: '#E5D5B0'
  status-success: '#2E7D32'
  status-error: '#D32F2F'
  status-info: '#0277BD'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for high-utility administrative environments and polished student portals. The aesthetic follows a **Corporate / Modern** movement, emphasizing institutional authority, reliability, and precision. It leverages a deep, academic palette to instill confidence in data integrity while utilizing modern whitespace techniques to prevent the cognitive fatigue often associated with ERP software.

The visual narrative is "Stability through Structure." Every element is aligned to a rigorous grid, using purposeful color application to guide users through complex workflows. The experience should feel established and premium, yet technically agile.

## Colors

The color strategy is anchored by **Bottle Green**, utilized primarily for navigation, headers, and primary actions to evoke a sense of tradition and security. **Gold** is reserved for high-impact accents: highlighting achievements, active states in student portals, or critical administrative call-outs.

To maintain professional legibility in data-dense tables, the neutral palette favors cool-toned grays over pure blacks. Backgrounds use a very subtle green-tinted off-white to reduce glare during long sessions. Use the secondary gold sparingly to maintain its perceived value; it should function as a "reward" or a "focus" color rather than a structural one.

## Typography

The design system utilizes **IBM Plex Sans** for its systematic, engineered feel that excels in both large displays and dense data tables. The typeface provides excellent character disambiguation (e.g., distinguishing 'I', 'l', and '1'), which is critical for administrative tasks involving IDs and numerical data.

- **Headlines:** Use Semi-Bold (600) for primary page titles to anchor the layout.
- **Data Sets:** Use `body-sm` for table content to maximize information density without sacrificing legibility.
- **Labels:** All-caps labels with slight letter spacing are reserved for category headers and table column headers.

## Layout & Spacing

The design system employs a **Fixed Grid** model for desktop dashboards to ensure consistent positioning of data-heavy widgets. A 12-column system is used, with a standard 24px gutter.

- **Administrative View:** Maximize screen real estate by using a collapsible sidebar (280px expanded / 64px collapsed).
- **Student View:** Center-aligned content with wider margins (up to 80px) to provide a more approachable, less "technical" experience.
- **Density:** Spacing follows a 4px baseline. Use `sm` (16px) for internal card padding and `md` (24px) for spacing between major UI blocks.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than heavy shadows. This keeps the interface clean and "high-fidelity."

1. **Floor:** The main background uses `surface-background`.
2. **Plinth:** Content cards and data containers use `surface-card` with a 1px border (#E0E4E3).
3. **Lift:** Active elements or modals use a very soft, diffused ambient shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to suggest interaction.

Avoid multiple levels of shadows. Depth should be felt through subtle changes in surface color and crisp border definitions.

## Shapes

The design system adopts a **Soft** shape language. A 4px standard radius (0.25rem) is applied to most UI components to strike a balance between a modern look and the professional "seriousness" required of an ERP.

- **Standard Elements:** (Inputs, Buttons, Cards) use 4px.
- **Large Containers:** (Modals, Feature Panels) may use 8px (rounded-lg).
- **Status Indicators:** Chips and badges use a full pill-shape (999px) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Bottle Green (#004D40) with white text. 4px radius.
- **Secondary:** Outlined Bottle Green or Solid Gold (#C5A059) for "Success/Action" states in student portals.
- **Ghost:** Used for less critical actions in toolbars to reduce visual noise.

### Data Tables
- **Header:** Light gray background (#F1F3F2) with `label-md` typography.
- **Rows:** Alternating "Zebra" striping is discouraged; use subtle 1px bottom borders instead. Highlighting a row on hover using a very faint gold tint improves tracking across columns.

### Inputs & Fields
- Use "Floating Label" or "Top-Aligned Label" styles. 
- Focus state: 1px Bottle Green border with a subtle 2px outer glow in the same color.

### Progress Trackers
- For student admissions or degree audits, use a vertical or horizontal stepper. 
- Completed steps use Bottle Green; the active step is highlighted with a Gold border.

### Chips & Badges
- Used for status (e.g., "Paid", "Pending", "Enrolled"). 
- Use low-saturation background versions of the status colors (e.g., light green background with dark green text) for better readability.