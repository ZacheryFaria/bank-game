# TUI Feature Backlog

## High Priority

### Rate Editor Screen
- Interactive screen to adjust loan/deposit rates
- Use `h`/`l` or `←`/`→` to decrease/increase rates by 0.01%
- Use `H`/`L` or `Shift+←`/`Shift+→` for larger increments (0.1%)
- Visual bar chart showing rates relative to market rates
- Color coding: green if below market, red if above (for deposit rates, inverse for loan rates)
- Press `Enter` to save, `Esc` to cancel

### Portfolio Allocation Screen
- Adjust risk class allocations (super_prime, prime, near_prime, subprime)
- Visual slider representation using Unicode box characters
- Use `h`/`l` to adjust selected allocation
- Auto-adjust other allocations to maintain sum = 1.0
- Show expected default rates for each risk class
- Press `Enter` to save, `Esc` to cancel

### Transaction History Viewer
- Scrollable list of recent transactions
- Use `j`/`k` to navigate
- Filter by type: `/` to enter filter mode (vim-style search)
- Date range selection
- Export to CSV with `:export transactions.csv`

## Medium Priority

### Leaderboard Screen
- View top banks by total assets
- Navigate with `j`/`k`
- Press `Enter` on a bank to view details
- Real-time updates every 10 seconds
- Highlight your bank's position

### Bank Details Screen (View Other Banks)
- View another bank's public data
- See their rates, total assets, bank name
- Compare your rates to theirs side-by-side
- Press `Esc` to return to leaderboard

### Help Screen
- Press `?` to view all keybindings
- Organized by context (auth, dashboard, rates, etc.)
- Searchable with `/`
- Press `Esc` to close

### Settings Screen
- Configure auto-collect interval
- Toggle sound effects (terminal bell on collection)
- Set API URL for connecting to different backends
- Color theme selection (if ink supports)

## Low Priority

### Collection History
- View past collections with game time elapsed, net income, etc.
- Chart showing equity growth over time (ASCII art line chart)
- Navigate with `j`/`k`, press `Enter` to see full details

### Notifications System
- Toast-style notifications for:
  - Collection success
  - Rate changes saved
  - Errors
- Auto-dismiss after 3 seconds
- History accessible with `:notifications`

### Dashboard Customization
- Reorder dashboard widgets
- Hide/show different sections
- Save layout preferences locally

### Multi-Bank Support
- Switch between multiple banks (if user has multiple accounts)
- Tab-style navigation between banks
- Use `gt`/`gT` (vim-style) to switch tabs

## Nice-to-Have

### ASCII Charts
- Equity over time line chart
- Loan composition pie chart (by risk class)
- Deposit composition pie chart (by product type)
- Use box-drawing characters for visualization

### Macro Recording
- Record sequence of commands (like vim macros)
- Replay with `@a`, `@b`, etc.
- Useful for repetitive rate adjustments

### Background Collection
- Option to run collections automatically every N minutes
- Visual indicator when auto-collect is running
- Disable with `:set autocollect=off`

### Export/Import Strategies
- Save rate/allocation configurations
- Load saved strategies with `:load strategy-name`
- Share strategies as YAML files

### Integration with Web Frontend
- QR code generation to open web dashboard
- Sync preferences between TUI and web
- Use TUI for quick checks, web for detailed analysis
