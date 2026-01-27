# TODO

Work priorities and backlog for the bank-game project.

---

## Issue Tracking

**All tasks and work items are now tracked in beads.**

```bash
bd ready              # Find available work
bd list --priority 0  # View high priority tasks
bd show <id>          # View issue details
bd create            # Create new task
```

Run `bd list --all` to see all tracked work items.

---

## Ideas / Future Features

These are long-term ideas not yet prioritized for implementation.

### Gameplay Enhancements

See `docs/game-design.md` "Deferred Features" section for details.

- Dynamic market rates (derived from aggregate player behavior)
- Zero-sum demand pool (true competition for fixed demand)
- Interbank lending (player-to-player loans)
- Systemic contagion (bank failures affect others)
- Prestige system (reset at $100M with permanent bonuses)
- Economic events (Fed rate changes, recessions, housing bubbles)

### Platform Expansion

- Mobile app (React Native)
