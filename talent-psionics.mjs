import PowerData from './module/powerData.mjs';
import PowerSheet from './module/powerSheet.mjs';
import TP_CONFIG from './module/config.mjs';

const moduleID = 'talent-psionics';
const typePower = moduleID + '.power';

Hooks.once('init', () => {
  foundry.utils.mergeObject(CONFIG, TP_CONFIG);

  Object.assign(CONFIG.Item.dataModels, {
    [typePower]: PowerData,
  });

  Items.registerSheet(moduleID, PowerSheet, {
    types: [typePower],
    makeDefault: true,
    label: 'TalentPsionics.Sheets.Power',
  });
});

/**
 *
 * LOCALIZING THE CONFIG OBJECT
 *
 */

Hooks.once('i18nInit', () => {
  _localizeHelper(CONFIG.TALENT_PSIONICS);
});

function _localizeHelper(object) {
  for (const [key, value] of Object.entries(object)) {
    switch (typeof value) {
      case 'string':
        if (value.startsWith('TalentPsionics') || value.startsWith('DND5E'))
          object[key] = game.i18n.localize(value);
        break;
      case 'object':
        _localizeHelper(object[key]);
        break;
    }
  }
}

/**
 *
 * INLINE POWER DISPLAY
 *
 */

Hooks.on('renderActorSheet5e', (app, html, context) => {
  if (!game.user.isGM && app.actor.limited) return true;
  const newCharacterSheet = app.constructor.name === 'ActorSheet5eCharacter2';
  if (context.isCharacter || context.isNPC) {
    const owner = context.actor.isOwner;
    let powers = context.items.filter((i) => i.type === typePower);
    powers = app._filterItems(powers, app._filters.spellbook.properties);
    if (!powers.length) return true;
    const levels = context.system.spells;
    const spellbook = context.spellbook;
    const useLabels = { '-20': '-', '-10': '-', 0: '&infin;' };
    const sections = { atwill: -20, innate: -10, pact: 0.5 };
    const cantripOffset =
      !!spellbook.find((s) => s?.order === sections.atwill) +
      !!spellbook.find((s) => s?.order === sections.innate);
    const levelOffset =
      cantripOffset + !!spellbook.find((s) => s?.order === sections.pact);
    const emptyTen = Array.from({ length: 10 });
    if (!!spellbook.length) {
      // Resolving #5 - bad order for mixed psionics + spellcasting if have spells > spell level.
      const manifestLevels = emptyTen.map((e, i) =>
        spellbook.findIndex((s) => s?.order === i)
      );
      let inserted = 0;
      for (const index in manifestLevels) {
        const i = Number(index);
        if (i === 0 && manifestLevels[i] === -1) {
          inserted += 1;
          // Cantrip special case
          spellbook.splice(cantripOffset, 0, undefined);
        } else if (manifestLevels[i] + inserted !== i + levelOffset) {
          inserted += 1;
          spellbook.splice(i + levelOffset, 0, undefined);
        }
      }
    }

    const registerSection = (
      sl,
      p,
      label,
      { preparationMode = 'prepared', value, max, override } = {}
    ) => {
      const aeOverride = foundry.utils.hasProperty(
        context.actor.overrides,
        `system.spells.spell${p}.override`
      );
      const i = p ? p + levelOffset : p + cantripOffset;
      spellbook[i] = {
        order: p,
        label: label,
        usesSlots: p > 0,
        canCreate: owner,
        canPrepare: context.actor.type === 'character' && p >= 1,
        spells: [],
        uses: useLabels[p] || value || 0,
        slots: useLabels[p] || max || 0,
        override: override || 0,
        dataset: {
          type: 'spell',
          level: preparationMode in sections ? 1 : p,
          preparationMode,
        },
        prop: sl,
        editable: context.editable && !aeOverride,
      };
    };

    powers.forEach((power) => {
      foundry.utils.mergeObject(power, {
        labels: power.system.labels,
      });

      // Activation
      const cost = power.system.activation?.cost;
      const abbr = {
        action: 'DND5E.ActionAbbr',
        bonus: 'DND5E.BonusActionAbbr',
        reaction: 'DND5E.ReactionAbbr',
        minute: 'DND5E.TimeMinuteAbbr',
        hour: 'DND5E.TimeHourAbbr',
        day: 'DND5E.TimeDayAbbr',
      }[power.system.activation.type];

      const itemContext = newCharacterSheet
        ? {
            activation:
              cost && abbr
                ? `${cost}${game.i18n.localize(abbr)}`
                : power.labels.activation,
            preparation: { applicable: false },
          }
        : {
            toggleTitle: CONFIG.DND5E.spellPreparationModes.always,
            toggleClass: 'fixed',
          };

      if (newCharacterSheet) {
        // Range
        const units = power.system.range?.units;
        if (units && units !== 'none') {
          if (units in CONFIG.DND5E.movementUnits) {
            itemContext.range = {
              distance: true,
              value: power.system.range.value,
              unit: game.i18n.localize(`DND5E.Dist${units.capitalize()}Abbr`),
            };
          } else itemContext.range = { distance: false };
        }

        // To Hit
        const toHit = parseInt(power.labels.modifier);
        if (power.hasAttack && !isNaN(toHit)) {
          itemContext.toHit = {
            sign: Math.sign(toHit) < 0 ? '-' : '+',
            abs: Math.abs(toHit),
          };
        }
      }

      foundry.utils.mergeObject(context.itemContext[power.id], itemContext);

      const p = power.system.order;
      const pl = `spell${p}`;
      const index = p ? p + levelOffset : p + cantripOffset;
      if (!spellbook[index]) {
        registerSection(pl, p, CONFIG.TALENT_PSIONICS.powerOrders[p], {
          levels: levels[pl],
        });
      }

      // Add the power to the relevant heading
      spellbook[index].spells.push(power);
    });
    for (const i in spellbook) {
      if (spellbook[i] === undefined) delete spellbook[i];
    }
    const spellList = newCharacterSheet
      ? html.find('.spells')
      : html.find('.spellbook');
    const spellListTemplate = newCharacterSheet
      ? 'systems/dnd5e/templates/actors/tabs/character-spells.hbs'
      : 'systems/dnd5e/templates/actors/parts/actor-spellbook.hbs';
    renderTemplate(spellListTemplate, context).then((partial) => {
      spellList.html(partial);

      if (newCharacterSheet) {
        const schoolSlots = spellList.find('.item-detail.item-school');
        /** @type {Array<string>} */
        const specialties = Object.values(
          CONFIG.TALENT_PSIONICS.specialties
        ).map((s) => s.label);
        for (const div of schoolSlots) {
          if (specialties.includes(div.dataset.tooltip)) {
            div.innerHTML = `<dnd5e-icon src="modules/talent-psionics/assets/icons/${div.dataset.tooltip.toLowerCase()}.svg"></dnd5e-icon>`;
          }
        }

        const schoolFilter = spellList.find('item-list-controls .filter-list');
        schoolFilter.append(
          Object.values(CONFIG.TALENT_PSIONICS.specialties).map((s) => {
            `<li><button type="button" class="filter-item">${s.label}</button></li>`;
          })
        );
      }
      app.activateListeners(spellList);
    });
  } else return true;
});
