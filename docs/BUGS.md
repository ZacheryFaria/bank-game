# Known Issues

Tracked bugs and issues in the bank-game project.

---

## Issue Tracking

**All bugs and issues are now tracked in beads.**

```bash
bd ready              # Find available work (includes bugs)
bd list --type bug    # View all bugs
bd show <id>          # View bug details
bd create --type bug  # Report new bug
```

Run `bd list --all` to see all tracked issues.

---

## How to Report Bugs

When you discover a bug:

1. Check if it's already tracked: `bd list --type bug`
2. Create a new issue: `bd create --type bug --title "Bug title" --body "Description"`
3. Set priority: `bd update <id> --priority 0` (for critical bugs)
4. Add details: reproduction steps, expected behavior, actual behavior, impact

For critical production issues, also notify the team immediately.
