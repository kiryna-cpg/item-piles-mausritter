# Changelog

All notable changes to this project will be documented in this file.

## [0.0.4] - 2026-02-16
### Added
- Centralized tradeability filter `isTradeable(item, actor)` used to exclude non-tradeable items from Item Piles flows.
- Conditions (`type: condition`) are always excluded from trade/transfer.
- Heuristic exclusion of creature natural weapons/armors (cost = 0 and pips.max = 0 on creature actors).
- Per-item override flag: `flags.item-piles-mausritter.tradeable = true/false`.
- Item sheet tri-state selector (Auto / Yes / No) for the tradeable override.
- Item Piles integration updated to include `ITEM_FILTERS` for conditions where applicable.

## [0.0.2] - 2026-02-12
### Added
- Manifest + release download support for Foundry installation.
- World Settings menu: “Reset Recommended Settings”.
- Safe one-time setup (does not overwrite manual Item Piles settings after initial setup).

### Changed
- Uses attribute currency configuration for Pepitas: `system.pips.value`.
- Default configuration tuned for slot-based inventory (no stacking).

## [0.0.1] - 2026-02-12
### Added
- Initial companion module with Mausritter-specific Item Piles settings.
