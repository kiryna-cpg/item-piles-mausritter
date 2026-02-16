/* Item Piles: Mausritter
 * Companion module for Mausritter system integration.
 *
 * Scope:
 * - Apply recommended Item Piles settings for Mausritter (one-time, unless forced via reset).
 * - Provide a “Reset recommended settings” World Settings menu.
 * - Tradeable item filtering:
 *   - Always exclude Conditions
 *   - Exclude creature natural attacks/armor via a conservative heuristic
 *   - Allow manual override via flag: flags.item-piles-mausritter.tradeable = true/false
 */

console.log("Item Piles: Mausritter | module.js loaded", { version: "0.0.4-dev", time: Date.now() });

const MODULE_ID = "item-piles-mausritter";

/* -------------------------------------------- */
/* Safe settings helpers                         */
/* -------------------------------------------- */

function hasSetting(key) {
  return game.settings?.settings?.has(`${MODULE_ID}.${key}`);
}

function getSettingSafe(key, fallback) {
  if (!hasSetting(key)) return fallback;
  return game.settings.get(MODULE_ID, key);
}

async function setSettingSafe(key, value) {
  if (!hasSetting(key)) return;
  await game.settings.set(MODULE_ID, key, value);
}

/* -------------------------------------------- */
/* Tradeable filtering                            */
/* -------------------------------------------- */

/**
 * Manual override flag path.
 * If set to boolean, it takes precedence over heuristics.
 */
function getTradeableFlag(item) {
  const data = item instanceof Item ? item.toObject() : item;
  const v = foundry.utils.getProperty(data, `flags.${MODULE_ID}.tradeable`);
  return typeof v === "boolean" ? v : undefined;
}

/**
 * Conservative heuristic to detect "non-tradeable" Mausritter items.
 *
 * Rules:
 * - Conditions are never tradeable.
 * - Natural attacks / natural armor on creature actors are not tradeable.
 *   Heuristic:
 *     actor.type === "creature" &&
 *     item.type in ["weapon","armor"] &&
 *     system.cost === 0 &&
 *     system.pips.max === 0
 *
 * Anything misclassified can be forced with:
 *   flags.item-piles-mausritter.tradeable = true/false
 */
export function isTradeable(item, actor = null) {
  const data = item instanceof Item ? item.toObject() : item;

  // Manual override
  const override = getTradeableFlag(data);
  if (override !== undefined) return override;

  // Never trade Conditions
  if (data?.type === "condition") return false;

  // Natural weapons/armor (creatures)
  const actorType = actor?.type ?? null;
  const isCreature = actorType === "creature";

  if (isCreature && (data?.type === "weapon" || data?.type === "armor")) {
    const cost = Number(foundry.utils.getProperty(data, "system.cost") ?? 0);
    const pipsMax = Number(foundry.utils.getProperty(data, "system.pips.max") ?? 0);

    // Very common for natural attacks/armor: cost 0 and no usage dots
    if (cost === 0 && pipsMax === 0) return false;
  }

  return true;
}

/**
 * Patch Item Piles APIs so non-tradeable items are treated as invalid for trade/transfer.
 * Prefer libWrapper if available; fallback to a safe monkeypatch.
 *
 * NOTE: We keep this runtime-only and controlled by a world setting.
 */
function registerTradeableFiltering() {
  const enabled = getSettingSafe("enableTradeableFiltering", true);
  if (!enabled) {
    console.log("Item Piles: Mausritter | Tradeable filtering disabled by setting.");
    return;
  }

  if (!game.itempiles?.API) {
    console.warn("Item Piles: Mausritter | Item Piles API not found; cannot register tradeable filtering.");
    return;
  }

  // Wrapper: isItemInvalid({ item, actor, ... }) -> true if Item Piles thinks invalid OR we think non-tradeable
  const wrapIsItemInvalid = async (wrapped, ...args) => {
    const result = await wrapped(...args);
    if (result) return true;

    const payload = args?.[0];
    const item = payload?.item ?? payload;
    const actor = payload?.actor ?? payload?.sourceActor ?? payload?.targetActor ?? null;

    return !isTradeable(item, actor);
  };

  // Wrapper: getActorItems(...) -> filter out non-tradeable items from any UI lists (trade panes, etc.)
  const wrapGetActorItems = async (wrapped, ...args) => {
    const items = await wrapped(...args);

    // Try to infer actor from common call patterns
    let actor = null;
    const first = args?.[0];
    if (first?.actor) actor = first.actor;
    else if (first instanceof Actor) actor = first;
    else if (first?.document instanceof Actor) actor = first.document;

    if (!Array.isArray(items)) return items;
    return items.filter((it) => isTradeable(it, actor));
  };

  // Prefer libWrapper (Item Piles depends on it in many setups, but we still defensively handle absence)
  if (globalThis.libWrapper?.register) {
    try {
      globalThis.libWrapper.register(MODULE_ID, "game.itempiles.API.isItemInvalid", wrapIsItemInvalid, "WRAPPER");
      globalThis.libWrapper.register(MODULE_ID, "game.itempiles.API.getActorItems", wrapGetActorItems, "WRAPPER");
      console.log("Item Piles: Mausritter | Tradeable filtering registered via libWrapper.");
      return;
    } catch (e) {
      console.warn("Item Piles: Mausritter | libWrapper registration failed; falling back to monkeypatch.", e);
    }
  }

  // Fallback monkeypatch (best-effort)
  try {
    const api = game.itempiles.API;

    if (typeof api.isItemInvalid === "function" && !api.isItemInvalid.__ipmrPatched) {
      const original = api.isItemInvalid.bind(api);
      api.isItemInvalid = async (...args) => wrapIsItemInvalid(original, ...args);
      api.isItemInvalid.__ipmrPatched = true;
    }

    if (typeof api.getActorItems === "function" && !api.getActorItems.__ipmrPatched) {
      const original = api.getActorItems.bind(api);
      api.getActorItems = async (...args) => wrapGetActorItems(original, ...args);
      api.getActorItems.__ipmrPatched = true;
    }

    console.log("Item Piles: Mausritter | Tradeable filtering registered via monkeypatch.");
  } catch (e) {
    console.warn("Item Piles: Mausritter | Failed to register tradeable filtering.", e);
  }
}

/* -------------------------------------------- */
/* Recommended settings                           */
/* -------------------------------------------- */

function recommendedItemPilesSettings() {
  return {
    actorClassType: "storage",
    itemPriceAttribute: "system.cost",
    itemQuantityAttribute: "flags.item-piles.quantity",
    currencies: [
      {
        type: "attribute",
        name: game.i18n.localize("IPMR.Currency.Pips"),
        primary: true,
        img: "icons/commodities/gems/gem-rough-cushion-white.webp",
        abbreviation: "{#}P",
        exchangeRate: 1,
        data: { path: "system.pips.value" }
      }
    ],
    // Slot inventory: do not stack anything
    unstackableItemTypes: ["item", "weapon", "armor", "storage", "condition", "spell"],
    // Prevent “merging” by similarity
    itemSimilarities: ["_id"]
  };
}

async function applyRecommendedSettings({ force = false } = {}) {
  if (game.system.id !== "mausritter") return;

  // Only apply once unless forced
  if (!force && getSettingSafe("setupDone", false)) return;

  const rec = recommendedItemPilesSettings();

  await game.settings.set("item-piles", "actorClassType", rec.actorClassType);
  await game.settings.set("item-piles", "itemPriceAttribute", rec.itemPriceAttribute);
  await game.settings.set("item-piles", "itemQuantityAttribute", rec.itemQuantityAttribute);
  await game.settings.set("item-piles", "currencies", rec.currencies);
  await game.settings.set("item-piles", "unstackableItemTypes", rec.unstackableItemTypes);
  await game.settings.set("item-piles", "itemSimilarities", rec.itemSimilarities);

  // Optional integration (non-critical)
  if (game.itempiles?.API?.addSystemIntegration) {
    try {
      game.itempiles.API.addSystemIntegration(
        {
          VERSION: "1.0.0",
          ACTOR_CLASS_TYPE: rec.actorClassType,
          ITEM_PRICE_ATTRIBUTE: rec.itemPriceAttribute,
          ITEM_QUANTITY_ATTRIBUTE: rec.itemQuantityAttribute,
          ITEM_SIMILARITIES: rec.itemSimilarities
        },
        "latest"
      );
    } catch (e) {
      console.warn("Item Piles: Mausritter | addSystemIntegration failed (non-critical):", e);
    }
  }

  await setSettingSafe("setupDone", true);
}

/* -------------------------------------------- */
/* Foundry hooks                                 */
/* -------------------------------------------- */

Hooks.once("init", () => {
  try {
    console.log("Item Piles: Mausritter | init START");

    // Hidden flag to avoid overwriting manual settings after first setup
    game.settings.register(MODULE_ID, "setupDone", {
      name: game.i18n.localize("IPMR.Settings.SetupDone.Name"),
      hint: game.i18n.localize("IPMR.Settings.SetupDone.Hint"),
      scope: "world",
      config: false,
      type: Boolean,
      default: false
    });

    // World setting: enable/disable tradeable filtering
    game.settings.register(MODULE_ID, "enableTradeableFiltering", {
      name: game.i18n.localize("IPMR.Settings.EnableTradeableFiltering.Name"),
      hint: game.i18n.localize("IPMR.Settings.EnableTradeableFiltering.Hint"),
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // World Settings -> Menu
    game.settings.registerMenu(MODULE_ID, "resetRecommended", {
      name: game.i18n.localize("IPMR.Menu.Reset.Name"),
      hint: game.i18n.localize("IPMR.Menu.Reset.Hint"),
      label: game.i18n.localize("IPMR.Menu.Reset.Label"),
      icon: "fas fa-rotate-left",
      restricted: true,
      type: class ResetMenu extends foundry.applications.api.ApplicationV2 {
        async render() {
          const html =
            `<p>${game.i18n.localize("IPMR.Dialog.Reset.Body1")}</p>` +
            `<p><strong>${game.i18n.localize("IPMR.Dialog.Reset.WarningLabel")}</strong> ${game.i18n.localize("IPMR.Dialog.Reset.WarningText")}</p>`;

          new Dialog({
            title: game.i18n.localize("IPMR.Dialog.Reset.Title"),
            content: html,
            buttons: {
              cancel: { label: game.i18n.localize("IPMR.Dialog.Reset.Cancel") },
              reset: {
                label: game.i18n.localize("IPMR.Dialog.Reset.Confirm"),
                callback: async () => {
                  await applyRecommendedSettings({ force: true });
                  ui.notifications.info(game.i18n.localize("IPMR.Notifications.ResetDone"));
                }
              }
            },
            default: "cancel"
          }).render(true);

          // Do not render an app window
          return this.close();
        }
      }
    });

    console.log("Item Piles: Mausritter | init END");
  } catch (e) {
    console.error("Item Piles: Mausritter | init FAILED", e);
  }
});

// Ensure actors have pips initialized so currencies work (do not overwrite if present)
Hooks.on("preCreateActor", (doc, data) => {
  if (game.system.id !== "mausritter") return;

  const types = ["character", "hireling", "storage"];
  if (!types.includes(data.type)) return;

  if (foundry.utils.getProperty(data, "system.pips.value") === undefined) {
    foundry.utils.setProperty(data, "system.pips.value", 0);
  }
});

// Item Piles boot hook (register runtime filters once Item Piles is ready)
Hooks.once("item-piles-ready", () => {
  registerTradeableFiltering();
});

// One-time setup after everything is ready
Hooks.once("ready", async () => {
  await applyRecommendedSettings({ force: false });
  console.log("Item Piles: Mausritter | ready");
});
