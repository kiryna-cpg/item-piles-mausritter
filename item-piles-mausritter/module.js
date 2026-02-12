console.log("Item Piles: Mausritter | module.js cargado", { version: "0.0.2", time: Date.now() });

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
        name: "Pepitas",
        primary: true,
        img: "icons/commodities/gems/gem-rough-cushion-white.webp",
        abbreviation: "{#}P",
        exchangeRate: 1,
        data: { path: "system.pips.value" }
      }
    ],
    unstackableItemTypes: ["item", "weapon", "armor", "storage", "condition", "spell"],
    itemSimilarities: ["_id"]
  };
}

async function applyRecommendedSettings({ force = false } = {}) {
  if (game.system.id !== "mausritter") return;
  if (!force && getSetupDoneSafe()) return;

  const rec = recommendedItemPilesSettings();

  await game.settings.set("item-piles", "actorClassType", rec.actorClassType);
  await game.settings.set("item-piles", "itemPriceAttribute", rec.itemPriceAttribute);
  await game.settings.set("item-piles", "itemQuantityAttribute", rec.itemQuantityAttribute);
  await game.settings.set("item-piles", "currencies", rec.currencies);
  await game.settings.set("item-piles", "unstackableItemTypes", rec.unstackableItemTypes);
  await game.settings.set("item-piles", "itemSimilarities", rec.itemSimilarities);

  // Integración opcional
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
      console.warn("Item Piles: Mausritter | addSystemIntegration falló:", e);
    }
  }

  await setSetupDoneSafe(true);
}

Hooks.once("init", () => {
  try {
    console.log("Item Piles: Mausritter | init START");

game.settings.registerMenu(MODULE_ID, "resetRecommended", {
  name: "Restablecer configuración recomendada",
  hint: "Reaplica la configuración recomendada de Item Piles para Mausritter.",
  label: "Abrir",
  icon: "fas fa-rotate-left",
  restricted: true,
  type: class ResetMenu extends foundry.applications.api.ApplicationV2 {
    async render() {
      const html =
        "<p>Esto volverá a aplicar la configuración recomendada de Item Piles para Mausritter.</p>" +
        "<p><strong>Nota:</strong> Sobrescribe los ajustes actuales de Item Piles.</p>";

      new Dialog({
        title: "Item Piles: Mausritter | Restablecer configuración",
        content: html,
        buttons: {
          cancel: { label: "Cancelar" },
          reset: {
            label: "Restablecer",
            callback: async () => {
              await applyRecommendedSettings({ force: true });
              ui.notifications.info("Item Piles: Mausritter | Configuración restablecida.");
            }
          }
        },
        default: "cancel"
      }).render(true);

      // No queremos renderizar ventana propia; cerramos al instante
      return this.close();
    }
  }
});
    console.log("Item Piles: Mausritter | registered resetRecommended");
    console.log("Item Piles: Mausritter | init END");
  } catch (e) {
    console.error("Item Piles: Mausritter | init FAILED", e);
  }
});

Hooks.on("preCreateActor", (doc, data) => {
  if (game.system.id !== "mausritter") return;
  const types = ["character", "hireling", "storage"];
  if (!types.includes(data.type)) return;

  if (foundry.utils.getProperty(data, "system.pips.value") === undefined) {
    foundry.utils.setProperty(data, "system.pips.value", 0);
  }
});

Hooks.once("ready", async () => {
  await applyRecommendedSettings({ force: false });
  console.log("Item Piles: Mausritter | Listo.");
});