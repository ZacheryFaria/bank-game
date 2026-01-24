# User Feedback & UX Improvements

Feedback from initial TUI testing session (2026-01-23).

## High Priority

### 1. Fix Vim Keybinding Modality

**Issue**: When typing in a text input (email, password, bank name), pressing `:` types the character instead of entering command mode.

**Expected Behavior**:
- When actively typing in a text input, ALL vim keybindings should be disabled
- User must press `Esc` to exit the input field first
- After exiting input with `Esc`, vim keybindings (`:`, `j`, `k`, etc.) should work
- Clear visual indicator when input is "focused" vs "unfocused"

**Implementation Notes**:
- Add `inputMode` state to track when user is in a text input
- Disable `useKeyBindings` hook when `inputMode === true`
- Add visual feedback (border color change) to show input focus
- Add "Press Esc to exit" hint near active inputs

**Files to Modify**:
- `tui/src/hooks/useKeyBindings.ts` - add inputMode parameter
- `tui/src/components/LoginScreen.tsx` - manage inputMode state
- `tui/src/components/RegisterScreen.tsx` - manage inputMode state

### 2. Add Visual Borders and Edges

**Issue**: TUI lacks visual structure, making it hard to distinguish between sections.

**Required Borders**:

1. **Screen Container** - Outer border around entire TUI window
   - Title bar with app name and current screen
   - Clean outer frame

2. **Major Sections** - Dashboard sections need clear separation
   - Financials box (Equity, Loans, Deposits)
   - Interest Rates section
   - Collection status section
   - Login/Register form containers

3. **Input Fields** - Show which input is active
   - Active input: highlighted border (cyan/green)
   - Inactive inputs: dimmed border (gray)
   - Clear "focused" state

4. **Command Mode Bar** - Visually distinct command input
   - Bottom bar with `:` prefix
   - Different background/border color
   - Always visible when in command mode

**Design Example**:
```
┌─────────────────────────────────────────┐
│ 🏦 Bank Game - Dashboard                │
├─────────────────────────────────────────┤
│                                         │
│ ┌─ 💰 Financials ─────────────────────┐ │
│ │ Equity:   $200,000                  │ │
│ │ Loans:    $0                        │ │
│ │ Deposits: $0                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ 📊 Interest Rates ─────────────────┐ │
│ │ high_risk_loan: 8.50%               │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
 :quit█
```

**Implementation Notes**:
- Use Ink `<Box borderStyle="round">` for major sections
- Use `borderColor` prop for active/inactive states
- Create reusable `<Section>` component wrapper
- Add consistent padding/margin between sections

**Files to Create**:
- `tui/src/components/ui/Section.tsx` - reusable bordered section
- `tui/src/components/ui/InputBox.tsx` - bordered text input wrapper

**Files to Modify**:
- `tui/src/components/Dashboard.tsx` - wrap sections in borders
- `tui/src/components/LoginScreen.tsx` - add screen border
- `tui/src/components/RegisterScreen.tsx` - add screen border
- `tui/src/App.tsx` - add outer container border and command bar

## Medium Priority

### 3. Input Field UX Improvements

**Issues**:
- No visual feedback when typing
- Can't tell which field is active
- No clear way to know if you can use vim keybindings

**Improvements**:
- Show character count for password (8/∞)
- Show validation errors inline (red text below input)
- Add placeholder text in inputs
- Show "typing mode" indicator (e.g., "-- INSERT --" like vim)
- Add help text: "Esc to exit input | Enter to submit"

### 4. Command Mode Visual Feedback

**Issues**:
- Command mode bar appears at arbitrary location
- Not clear what commands are available

**Improvements**:
- Always show command bar at bottom (even when empty/inactive)
- Show available commands when not in command mode: `[c] collect | [:logout] logout | [:q] quit`
- When in command mode, show: `:█` with cursor
- Add command history (↑/↓ to navigate previous commands)
- Tab completion for commands

### 5. Loading and Error States

**Issues**:
- Spinners are small and easy to miss
- Error messages don't stand out
- Success messages disappear too quickly

**Improvements**:
- Larger, more prominent spinners with status text
- Error messages in red bordered boxes that stay on screen
- Success messages in green with ✓ checkmark
- Progress indicators for long operations

## Low Priority

### 6. Status Bar

**Feature**: Add a persistent status bar at top or bottom showing:
- Current screen/mode
- Connection status (backend reachable?)
- Vim mode indicator (NORMAL / INSERT / COMMAND)
- Time since last collection (for dashboard)

### 7. Color Scheme

**Improvements**:
- Positive values (equity gains) in green
- Negative values (losses) in red
- Warnings in yellow
- Info in cyan
- Consistent color palette across all screens

### 8. Keyboard Shortcuts Help

**Feature**: Press `?` to show help overlay with all keybindings for current screen

### 9. Animation and Polish

**Nice-to-haves**:
- Smooth transitions between screens
- Number counter animations (equity increasing)
- Progress bars for collection cooldown
- Celebration animation on successful collection

## Questions for Clarification

- [ ] Should we add a "status line" like vim has at the bottom?
- [ ] Any preference for border style? (round, single, double, bold)
- [ ] Should command mode remember history between sessions?
- [ ] Color theme preference? (Default, Solarized, Monokai, etc.)

## Related Files

- `todos/TUI_FEATURES.md` - Future features backlog
- `design/TUI_ARCHITECTURE.md` - Architecture documentation
- `tui/README.md` - User-facing documentation
