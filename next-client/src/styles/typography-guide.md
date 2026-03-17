# Candidate Portal Typography Guide

## Font Size Hierarchy

All font sizes use `rem` units and scale with the user's Text Size preference (Small: 17px, Default: 20px, Large: 24px base).

### Usage Rules

| Level | Tailwind Class | rem | Small | Default | Large | Usage |
|-------|---------------|-----|-------|---------|-------|-------|
| **Page Title** | `text-2xl font-semibold` | 1.5rem | 25.5px | 30px | 36px | Page main heading (e.g., "Job Search", "My Profile") |
| **Section Title** | `text-xl font-semibold` | 1.25rem | 21.25px | 25px | 30px | Major section headings (e.g., "Personal Information", "Work Experience") |
| **Subsection Title** | `text-lg font-medium` | 1.125rem | 19px | 22.5px | 27px | Card titles, dialog titles, subsection headings |
| **Body Text** | `text-base` | 1rem | 17px | 20px | 24px | Main content, form labels, descriptions |
| **Secondary Text** | `text-sm text-muted-foreground` | 0.875rem | 14.9px | 17.5px | 21px | Helper text, metadata, timestamps |
| **Small Text** | `text-xs text-muted-foreground` | 0.75rem | 12.75px | 15px | 18px | Tags, badges, fine print |

### Font Weights

- **Bold**: `font-bold` (700) - Rarely used, only for strong emphasis
- **Semibold**: `font-semibold` (600) - Page titles, section titles
- **Medium**: `font-medium` (500) - Subsection titles, emphasized body text
- **Regular**: `font-normal` (400) - Default for body text

### Examples

```tsx
// Page title
<h1 className="text-2xl font-semibold text-[var(--gray-900)]">Job Search</h1>

// Section title
<h2 className="text-xl font-semibold text-[var(--gray-900)]">Personal Information</h2>

// Subsection title / Card title
<h3 className="text-lg font-medium text-[var(--gray-900)]">Contact Details</h3>

// Body text
<p className="text-base text-[var(--gray-700)]">Your profile is 80% complete.</p>

// Secondary text
<span className="text-sm text-muted-foreground">Last updated 2 hours ago</span>

// Small text / Badge
<span className="text-xs text-muted-foreground">Remote</span>
```

## Migration Checklist

When updating existing components:

1. Replace arbitrary sizes like `text-[14px]`, `text-[16px]` with semantic classes
2. Ensure all text uses `rem`-based classes (not `px`)
3. Add appropriate font weights (`font-semibold`, `font-medium`)
4. Use color variables: `text-[var(--gray-900)]`, `text-muted-foreground`
5. Test with all three Text Size settings (Small/Default/Large)
