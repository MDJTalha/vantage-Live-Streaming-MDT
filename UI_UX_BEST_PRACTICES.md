# UI/UX BEST PRACTICES GUIDE
**For All Future Development**

---

## ACCESSIBILITY FIRST PATTERN (DO THIS FOR EVERY COMPONENT)

### 1. Interactive Elements (Buttons, Links, etc.)

```typescript
// ❌ BAD - No accessibility
<button onClick={handleClick}>
  <Icon className="h-5 w-5" />
</button>

// ✅ GOOD - Accessible
<button 
  onClick={handleClick}
  aria-label="Description of what button does"
  title="Hover tooltip with shortcut"
>
  <Icon className="h-5 w-5" aria-hidden="true" />
</button>

// ✅ BEST - With keyboard support
<button 
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Description (keyboard: Shift+M for shortcut)"
  title="Description (Shift+M)"
>
  <Icon className="h-5 w-5" aria-hidden="true" />
</button>
```

### 2. Form Inputs

```typescript
// ❌ BAD - No error handling
<input type="email" placeholder="Email" />

// ✅ GOOD - With error state
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    placeholder="Email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : "email-hint"}
  />
  {error && (
    <p id="email-error" className="text-destructive">
      {error}
    </p>
  )}
  {!error && (
    <p id="email-hint" className="text-muted-foreground text-sm">
      Format: user@example.com
    </p>
  )}
</div>
```

### 3. Lists and Collections

```typescript
// ❌ BAD - No semantic structure
<div className="space-y-2">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>

// ✅ GOOD - Semantic structure
<div role="list" className="space-y-2">
  {items.map(item => (
    <div 
      key={item.id} 
      role="listitem"
      aria-label={`${item.name} - ${item.status}`}
    >
      {item.name}
    </div>
  ))}
</div>

// ✅ BEST - Semantic HTML
<ul className="space-y-2">
  {items.map(item => (
    <li key={item.id} aria-label={`${item.name} - ${item.status}`}>
      {item.name}
    </li>
  ))}
</ul>
```

### 4. Error Messages & Alerts

```typescript
// ❌ BAD - No accessibility
{error && <div>{error}</div>}

// ✅ GOOD - Announced to screen readers
{error && (
  <div role="alert" className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
    {error}
  </div>
)}

// ✅ BEST - With ARIA live region for real-time updates
{error && (
  <div 
    role="alert" 
    aria-live="assertive"
    aria-atomic="true"
    className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg"
  >
    {error}
  </div>
)}
```

---

## DESIGN SYSTEM RULES (MUST FOLLOW)

### Color Palette (Crystal System Only)

```css
/* PRIMARY - Royal Sapphire */
--primary: 219 84% 52%;           /* #1E40AF */
--primary-light: 219 84% 60%;     /* #3B82F6 */
--primary-dark: 219 84% 45%;      /* #1E3A8A */

/* SECONDARY - Amethyst Purple */
--secondary: 271 76% 53%;         /* #8B5CF6 */
--secondary-light: 271 76% 62%;   /* #A78BFA */
--secondary-dark: 271 76% 45%;    /* #7C3AED */

/* ACCENT - Champagne Gold */
--accent: 45 93% 54%;             /* #F59E0B */
--accent-light: 45 93% 62%;       /* #FBBF24 */
--accent-dark: 45 93% 45%;        /* #D97706 */

/* SUCCESS - Emerald */
--success: 160 72% 49%;           /* #10B981 */

/* WARNING - Amber */
--warning: 38 92% 50%;            /* #F59E0B */

/* ERROR - Ruby */
--destructive: 3 89% 61%;         /* #EF4444 */

/* TEXT - Improved contrast */
--foreground: 210 40% 98%;        /* Primary text */
--foreground-secondary: 215 20% 85%; /* Secondary text */
--foreground-tertiary: 215 15% 65%; /* Subtle text (min 4.5:1) */
--foreground-muted: 215 12% 55%;  /* Muted text (min 4.5:1) */
```

### Never Use
- ❌ `--aurora-blue`, `--aurora-cyan` (removed)
- ❌ `--accent: cyan` (changed to gold)
- ❌ `--secondary: light purple` (standardized)

---

## COMPONENT CHECKLIST

Use this before committing ANY component:

### Accessibility
- [ ] All buttons/links have `aria-label` or descriptive text
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages use `role="alert"` and `aria-describedby`
- [ ] Icons use `aria-hidden="true"` when decorative
- [ ] Lists use `role="list"` and `role="listitem"`
- [ ] Color is not the only way to convey information
- [ ] Text has minimum 4.5:1 contrast ratio (WCAG AA)
- [ ] All interactive elements are keyboard accessible

### Mobile Responsiveness
- [ ] Mobile breakpoints tested: 320px, 375px, 768px, 1024px
- [ ] Touch targets minimum 44×44px (WCAG 2.5.5)
- [ ] No horizontal scrolling on mobile
- [ ] Responsive typography scaling
- [ ] Touch-friendly spacing between buttons

### Performance
- [ ] Components use `React.memo` if rendering frequently
- [ ] Heavy operations debounced (search, filter, resize)
- [ ] Images/assets optimized
- [ ] No unnecessary re-renders

### Error Handling
- [ ] Loading states with spinners/skeletons
- [ ] Error states with clear messages
- [ ] Empty states with guidance
- [ ] Retry functionality when applicable

### Testing
- [ ] Browser testing (Chrome, Firefox, Safari)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing (NVDA) if applicable

---

## ERROR STATE PATTERN (USE THIS TEMPLATE)

```typescript
import { useState } from 'react';
import { AlertCircle, Loader, CheckCircle2 } from 'lucide-react';

type State = 'idle' | 'loading' | 'error' | 'success';

export function MyComponent() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);

  const handleAction = async () => {
    setState('loading');
    setError(null);
    
    try {
      // Do something
      const result = await api.call();
      setData(result);
      setState('success');
      
      // Auto-reset success after 3 seconds
      setTimeout(() => setState('idle'), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-muted-foreground" role="status">
          <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Processing...</span>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div 
          role="alert" 
          className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">Error</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={handleAction}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && (
        <div 
          role="status" 
          className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <span>Success!</span>
        </div>
      )}

      {/* Main Content */}
      <button 
        onClick={handleAction} 
        disabled={state === 'loading'}
        className="..."
      >
        {state === 'loading' ? 'Processing...' : 'Perform Action'}
      </button>
    </div>
  );
}
```

---

## KEYBOARD NAVIGATION PATTERN

```typescript
// Pattern for custom keyboard support
export function MyInteractiveComponent() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow default behavior for Tab key
    if (e.key === 'Tab') return;

    // Implement custom shortcuts
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      handleMute();
    }
    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      handleVideo();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div onKeyDown={handleKeyDown} role="complementary">
      {/* Component content */}
    </div>
  );
}
```

---

## SEARCH WITH DEBOUNCE PATTERN

```typescript
// apps/web/src/hooks/useDebounce.ts (already created)
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in component
export function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300); // 300ms delay

  const results = useMemo(
    () => items.filter(item => 
      item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    ),
    [debouncedQuery]
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        aria-label="Search items"
      />
      {query && !debouncedQuery && (
        <p className="text-muted-foreground text-sm">Searching...</p>
      )}
      {results.length === 0 ? (
        <p>No results for "{debouncedQuery}"</p>
      ) : (
        <ul role="list">
          {results.map(item => (
            <li key={item.id} role="listitem">{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## REMEMBER THESE RULES

1. **Semantic HTML first** - Use `<button>`, `<form>`, `<nav>` instead of divs
2. **ARIA labels for icon buttons** - Always add `aria-label` to buttons without text
3. **Error states on every form** - Show what went wrong
4. **Loading states on every async action** - Let users know something is happening
5. **Empty states for collections** - Explain why nothing is shown
6. **Color contrast minimum 4.5:1** - Use webaim.org to verify
7. **Debounce search and filters** - Prevent UI lag
8. **Keyboard support for everything** - Tab, Enter, Escape must work
9. **Mobile-first responsive** - Design for 320px first
10. **Test with real devices** - Don't just use browser devtools

---

**Last Updated:** March 28, 2026  
**Version:** 2.0.0  
**Status:** Active - Follow These Guidelines
