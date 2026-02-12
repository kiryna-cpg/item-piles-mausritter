# Item Piles: Mausritter
Item Piles companion module for Mausritter System in Foundry VTT
This small module applies a set of recommended Item Piles settings tailored for Mausritter (currency stored on actors as `system.pips.value`, item prices in `system.cost`, and **no stacking** to match slot-based inventory).

---

## Features

- Auto-configures Item Piles for Mausritter (one-time setup)
- Adds **Pips** currency as an **attribute currency** (`system.pips.value`)
- Uses item price attribute: `system.cost`
- Disables stacking for all Mausritter item types (slot inventory)
- Adds a **World Settings** button to **Reset Recommended Settings**
- Avoids overwriting manual settings after initial setup (unless you use Reset)

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
- **Currency**: Pepitas stored on actors at `system.pips.value`
- **Unstackable item types**: all Mausritter item types (`item`, `weapon`, `armor`, `storage`, `condition`, `spell`)
- **Item similarity**: `_id` (prevents merging)

After initial setup, settings are not overwritten unless you choose **Reset Recommended Settings**.

---

## Reset recommended settings

If someone changes Item Piles settings and something breaks:

- Foundry → **World Settings** → **Item Piles: Mausritter**
- Click **Reset Recommended Settings**

This re-applies the recommended configuration and may overwrite current Item Piles settings.

---

## Localization

This module uses Foundry VTT’s configured language. Text will appear in the same language as your Foundry UI (e.g. Spanish → “Pepitas”, English → “Pips”). The module does not include a separate language setting.

---

## Compatibility notes

- Mausritter tracks currency as an **actor attribute** (`system.pips.value`), not as a physical “coin item”.
- Mausritter inventory is **slot-based** and items generally shouldn’t stack.
- This module is intentionally minimal: it doesn’t add item types, sheets, or rules automation.

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
