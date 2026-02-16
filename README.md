# Item Piles: Mausritter

**Item Piles companion module** for the **Mausritter** system in **Foundry VTT**.

This module applies a set of **recommended Item Piles settings** tailored for Mausritter:
- Currency stored on actors as `system.pips.value`
- Item prices in `system.cost`
- **No stacking** (to match slot-based inventory)

It also includes a **tradeability filter** so Item Piles won’t trade/transfer things that should not be traded (e.g. conditions or natural creature attacks/armor).

---

## Features

- **One-time** auto-configuration of Item Piles for Mausritter (won’t overwrite manual settings after initial setup)
- Adds **Pips** currency as an **attribute currency** (`system.pips.value`)
- Uses item price attribute: `system.cost`
- Disables stacking for all Mausritter item types (slot inventory)
- Adds a **World Settings** button: **Reset Recommended Settings**
- **Tradeability filtering**
  - Conditions (`type: condition`) are **never tradeable**
  - Natural creature attacks/armors are excluded via heuristic
  - Per-item override via flag: `flags.item-piles-mausritter.tradeable = true/false`
  - A tri-state selector is added to item sheets: **Auto / Yes / No**

---

## Requirements

- **Foundry VTT**: v13 (tested on **13.351**)
- **System**: Mausritter (tested with **0.3.x**)
- **Module**: Item Piles (tested with **3.x**)

---

## Installation

### Install via Manifest URL (recommended)

1. Foundry → **Add-on Modules** → **Install Module**
2. Paste this **Manifest URL**:
   - https://raw.githubusercontent.com/kiryna-cpg/item-piles-mausritter/main/module.json
3. Install, then enable it in your world:
   - **World** → **Manage Modules** → enable **Item Piles: Mausritter**

---

## What this module configures

Recommended Item Piles settings applied:

- **Default Item Pile Actor type**: `storage`
- **Item price attribute**: `system.cost`
- **Item quantity attribute**: `flags.item-piles.quantity` (internal Item Piles flag)
- **Currency**: Pips stored on actors at `system.pips.value`
- **Unstackable item types**: `item`, `weapon`, `armor`, `storage`, `condition`, `spell`
- **Item similarity**: `_id` (prevents merging)
- **Item filter**: excludes `condition` items from Item Piles lists

After initial setup, settings are not overwritten unless you choose **Reset Recommended Settings**.

---

## Reset recommended settings

If someone changes Item Piles settings and something breaks:

- Foundry → **World Settings** → **Item Piles: Mausritter**
- Click **Reset Recommended Settings**

This re-applies the recommended configuration and may overwrite current Item Piles settings.

---

## Tradeable items (filtering)

This module defines a single tradeability decision function internally and applies it consistently.

### Always excluded
- **Conditions** (`type: condition`) are never tradeable and will not be transferred by Item Piles.

### Creature natural attacks / armor (heuristic)
Certain creature items (often `weapon`/`armor`) are treated as **natural** and excluded from trade/transfer when:
- The owning actor is a **creature**
- The item is `weapon` or `armor`
- `system.cost === 0`
- `system.pips.max === 0`

If you have homebrew content that matches this heuristic unintentionally, use the override below.

### Manual override (recommended for homebrew)
You can force tradeability per item using:

- `flags.item-piles-mausritter.tradeable = true` (always tradeable)
- `flags.item-piles-mausritter.tradeable = false` (never tradeable)

A tri-state selector is also injected into Mausritter item sheets:
- **Auto** (no flag, uses heuristic)
- **Yes**
- **No**

---

## Localization

This module uses Foundry VTT’s configured language. Text will appear in the same language as your Foundry UI.
The module does not include a separate language setting.

---

## Compatibility notes

- Mausritter tracks currency as an **actor attribute** (`system.pips.value`), not as a physical “coin item”.
- Mausritter inventory is **slot-based** and items generally shouldn’t stack.
- This module is intentionally minimal: it doesn’t add item types, sheets (beyond a small injected control), or rules automation.

---

## Support / Issues

Report issues or request improvements here:
- https://github.com/kiryna-cpg/item-piles-mausritter/issues

When reporting, include:
- Foundry version
- Mausritter system version
- Item Piles version
- Steps to reproduce + console logs (F12)

---

## License

MIT. See `LICENSE`.