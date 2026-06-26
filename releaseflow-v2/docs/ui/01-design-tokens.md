# Design Tokens — ReleaseFlow UI

> Version: 1.0 | Last Updated: 2026-06-24

---

## Color Palette

### Primary

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `primary.50` | `#FFF1E6` | `--color-primary-50` | Light backgrounds |
| `primary.100` | `#FFDBB3` | `--color-primary-100` | Subtle accents |
| `primary.200` | `#FFC480` | `--color-primary-200` | Hover states |
| `primary.300` | `#FFAD4D` | `--color-primary-300` | Active states |
| `primary.400` | `#FF9626` | `--color-primary-400` | Focus rings |
| **`primary.500`** | **`#CC5500`** | **`--color-primary-500`** | **Primary actions, brand** |
| `primary.600` | `#A34400` | `--color-primary-600` | Pressed states |
| `primary.700` | `#7A3300` | `--color-primary-700` | Dark mode primary |
| `primary.800` | `#522200` | `--color-primary-800` | Deep accents |
| `primary.900` | `#291100` | `--color-primary-900` | Text on primary |

### Secondary

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `secondary.50` | `#FBF7F0` | `--color-secondary-50` | Light backgrounds |
| `secondary.100` | `#F5ECE2` | `--color-secondary-100` | Subtle accents |
| `secondary.200` | `#ECDCC5` | `--color-secondary-200` | Hover states |
| `secondary.300` | `#E2CCA8` | `--color-secondary-300` | Active states |
| `secondary.400` | `#DBBD8D` | `--color-secondary-400` | Focus rings |
| **`secondary.500`** | **`#D4A373`** | **`--color-secondary-500`** | **Secondary actions, highlights** |
| `secondary.600` | `#B88A5A` | `--color-secondary-600` | Pressed states |
| `secondary.700` | `#9C7144` | `--color-secondary-700` | Dark mode secondary |
| `secondary.800` | `#80582E` | `--color-secondary-800` | Deep accents |
| `secondary.900` | `#644018` | `--color-secondary-900` | Text on secondary |

### Surface

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `surface.50` | `#FAF6F1` | `--color-surface-50` | App background |
| `surface.100` | `#F4EEE7` | `--color-surface-100` | Card backgrounds |
| `surface.200` | `#EDE5DC` | `--color-surface-200` | Elevated surfaces |
| `surface.300` | `#E5DBD0` | `--color-surface-300` | Borders, dividers |
| `surface.400` | `#DCD0C3` | `--color-surface-400` | Strong borders |
| `surface.500` | `#D1C3B3` | `--color-surface-500` | Placeholder text |
| `surface.600` | `#B8A898` | `--color-surface-600` | Muted icons |
| `surface.700` | `#9E8E7E` | `--color-surface-700` | Disabled text |
| `surface.800` | `#857564` | `--color-surface-800` | Dark surfaces |
| `surface.900` | `#6B5C4B` | `--color-surface-900` | Dark borders |

### Text

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `text.900` | `#2C2419` | `--color-text-900` | Primary text, headings |
| `text.800` | `#3D3428` | `--color-text-800` | Secondary headings |
| `text.700` | `#5C5348` | `--color-text-700` | Body text |
| `text.600` | `#736A5E` | `--color-text-600` | Secondary body |
| `text.500` | `#8B8276` | `--color-text-500` | Metadata, captions |
| `text.400` | `#A39A8E` | `--color-text-400` | Placeholder text |
| `text.300` | `#BBB2A7` | `--color-text-300` | Disabled text |
| `text.200` | `#D2CABF` | `--color-text-200` | Subtle borders |
| `text.100` | `#EAE2D7` | `--color-text-100` | Very subtle |
| `text.50` | `#F5F0EA` | `--color-text-50` | Near white |

### Semantic

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `success.500` | `#2E7D32` | `--color-success-500` | Approved, completed, on-track |
| `success.50` | `#E8F5E9` | `--color-success-50` | Success backgrounds |
| `warning.500` | `#ED6C02` | `--color-warning-500` | At-risk, pending, overdue |
| `warning.50` | `#FFF3E0` | `--color-warning-50` | Warning backgrounds |
| `danger.500` | `#D32F2F` | `--color-danger-500` | Blocked, rejected, critical |
| `danger.50` | `#FFEBEE` | `--color-danger-50` | Danger backgrounds |
| `info.500` | `#0288D1` | `--color-info-500` | In-progress, informational |
| `info.50` | `#E1F5FE` | `--color-info-50` | Info backgrounds |

### Status Mapping

| Status | Color Token |
|---|---|
| Active / Completed / Approved / Ready | `success` |
| Draft / Pending / In Progress | `info` |
| At Risk / Overdue / Warning | `warning` |
| Blocked / Rejected / Critical / Archived | `danger` |

---

## Border Radius

| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| `radius.sm` | `8px` | `--radius-sm` | Buttons, inputs, badges |
| `radius.md` | `12px` | `--radius-md` | Cards, modals, panels |
| `radius.lg` | `16px` | `--radius-lg` | Large cards, dialogs |
| `radius.xl` | `24px` | `--radius-xl` | Main containers, sheets |
| `radius.full` | `9999px` | `--radius-full` | Pills, avatars, badges |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow.card` | `0 1px 3px rgba(44, 36, 25, 0.06), 0 1px 2px rgba(44, 36, 25, 0.04)` | Default cards, panels |
| `shadow.elevated` | `0 4px 6px rgba(44, 36, 25, 0.06), 0 2px 4px rgba(44, 36, 25, 0.04)` | Hovered cards, dropdowns |
| `shadow.modal` | `0 20px 60px rgba(44, 36, 25, 0.12), 0 8px 16px rgba(44, 36, 25, 0.08)` | Modals, drawers, sheets |

---

## Typography Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text.xs` | `12px` | `16px` | `400` | Captions, badges, metadata |
| `text.sm` | `14px` | `20px` | `400` | Body, labels, secondary text |
| `text.base` | `16px` | `24px` | `400` | Primary body text |
| `text.lg` | `18px` | `28px` | `500` | Section headings |
| `text.xl` | `20px` | `28px` | `600` | Card titles |
| `text.2xl` | `24px` | `32px` | `600` | Page headings |
| `text.3xl` | `30px` | `36px` | `700` | Hero titles |
| `text.4xl` | `36px` | `40px` | `700` | Landing page |

---

## Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `space.0` | `0` | No spacing |
| `space.1` | `4px` | Tight gaps, icon padding |
| `space.2` | `8px` | Inline gaps, badge padding |
| `space.3` | `12px` | List item gaps |
| `space.4` | `16px` | Card padding, section gaps |
| `space.5` | `20px` | Card internal padding |
| `space.6` | `24px` | Section padding |
| `space.8` | `32px` | Page padding, large gaps |
| `space.10` | `40px` | Section spacing |
| `space.12` | `48px` | Page section break |
| `space.16` | `64px` | Major sections |
