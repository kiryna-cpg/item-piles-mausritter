/* Item Piles: Mausritter
 * Companion module for Mausritter system integration.
 */

console.log("Item Piles: Mausritter | module.js loaded", { version: "0.0.2", time: Date.now() });

const MODULE_ID = "item-piles-mausritter";

function hasSetupSetting() {
  return game.settings?.settings?.has(`${MODULE_ID}.setupDone`);
}

function getSetupDoneSafe() {
  if (!hasSetupSetting()) return false;
  return game.settings.get(MODULE_ID, "setupDone");
}

async function setSetupDoneSafe(value) {
  if (!hasSetupSetting()) return;
  await game.settings.set(MODULE_ID, "setupDone", value);
}

function recommendedItemPilesSettings() {
  return {
    actorClassType: "storage",
    itemPriceAttribute: "system.cost",
    itemQuantityAttribute: "flags.item-piles.quantity",
    currencies: [
      {
        type: "attribute",
        name: "Pips",
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
  if (!force && getSetupDoneSafe()) return;

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

  await setSetupDoneSafe(true);
}

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

// One-time setup after everything is ready
Hooks.once("ready", async () => {
  await applyRecommendedSettings({ force: false });
  console.log("Item Piles: Mausritter | ready");
});
