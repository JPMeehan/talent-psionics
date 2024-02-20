import PowerData from './module/powerData.mjs';
import PowerSheet from './module/powerSheet.mjs';
import TP_CONFIG from './module/config.mjs';
import { CUSTOM_SHEETS, moduleID, typePower } from './module/utils.mjs';
import { addStrainTab } from './module/strain.mjs';

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

/**
 * @typedef SpellLevel
 */

Hooks.on('renderActorSheet5e', (app, html, context) => {
  if (!game.user.isGM && app.actor.limited) return true;
  const newCharacterSheet = app.constructor.name === CUSTOM_SHEETS.DEFAULT;
  if (context.isCharacter || context.isNPC) {
    const owner = context.actor.isOwner;
    let powers = context.items.filter((i) => i.type === typePower);
    powers = app._filterItems(powers, app._filters.spellbook.properties);
    if (!powers.length) return true;
    const levels = context.system.spells;
    /** @type {Array<SpellLevel>} */
    const spellbook = context.spellbook;
    const levelOffset = spellbook.length - 1;

    const registerSection = (
      sl,
      p,
      label,
      { preparationMode = 'prepared', override } = {}
    ) => {
      const aeOverride = foundry.utils.hasProperty(
        context.actor.overrides,
        `system.spells.spell${p}.override`
      );
      const i = p + levelOffset;
      spellbook[i] = {
        order: p,
        label: label,
        usesSlots: false,
        canCreate: owner,
        canPrepare: context.actor.type === 'character' && p >= 1,
        spells: [],
        uses: p > 1 ? '-' : '&infin;',
        slots: p > 1 ? '-' : '&infin;',
        override: override || 0,
        dataset: {
          type: typePower,
          order: p,
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
      const index = p + levelOffset;
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
        spellList
          .find('.items-section[data-type="talent-psionics.power"]')
          .find('.item-header.item-school')
          .html(game.i18n.localize('TalentPsionics.Power.Spec.Header'));

        const schoolSlots = spellList.find('.item-detail.item-school');
        /** @type {Array<{label: string, icon: string}>} */
        const specialties = Object.values(CONFIG.TALENT_PSIONICS.specialties);
        for (const div of schoolSlots) {
          const spec = specialties.find((s) => s.label === div.dataset.tooltip);
          if (spec) {
            div.innerHTML = `<dnd5e-icon src="${spec.icon}"></dnd5e-icon>`;
          }
        }

        const schoolFilter = spellList.find('item-list-controls .filter-list');
        schoolFilter.append(
          Object.values(CONFIG.TALENT_PSIONICS.specialties).map((s) => {
            `<li><button type="button" class="filter-item">${s.label}</button></li>`;
          })
        );
      } else {
        const sectionHeader = spellList.find(
          '.items-header.spellbook-header[data-type="talent-psionics.power"]'
        );
        sectionHeader
          .find('.spell-school')
          .html(game.i18n.localize('TalentPsionics.Power.Spec.Label'));
        sectionHeader
          .find('.spell-action')
          .html(game.i18n.localize('TalentPsionics.Power.Usage'));
        sectionHeader
          .find('.spell-target')
          .html(game.i18n.localize('TalentPsionics.Power.Target'));
      }
      app.activateListeners(spellList);
    });
  } else return true;
});

/**
 *
 * POWER USAGE
 *
 */

Hooks.on('dnd5e.preUseItem', (item, config, options) => {
  if (item.type === typePower && item.actor) {
    const powerOrder = item.system.order;
    switch (item.system.scaling.mode) {
      case 'none':
        return;
      case 'order1':
        config.order = powerOrder;
        break;
      case 'order':
        const maxOrder =
          Math.ceil(item.actor.classes.talent?.system.levels / 4) + 1;
        config.order = powerOrder;
        config.canIncreaseOrder = powerOrder < maxOrder;
        break;
    }
  }
});

Hooks.on('renderAbilityUseDialog', (dialog, html, context) => {
  const power = dialog.item;

  if (
    !power ||
    power.type !== typePower ||
    power.system.scaling.mode !== 'order'
  )
    return;

  const baseOrder = power.system.order;
  const maxOrder = Math.ceil(power.actor.classes.talent?.system.levels / 4) + 1;

  const choices = Object.entries(CONFIG.TALENT_PSIONICS.powerOrders).filter(
    ([order, label]) => !(order < baseOrder || order > maxOrder)
  );

  const select = `<select name="increasedOrder">
  ${HandlebarsHelpers.selectOptions(choices, {
    hash: {
      selected: baseOrder,
      nameAttr: 0,
      labelAttr: 1,
    },
  })}
  </select>`;

  html
    .find('#ability-use-form')
    .append(
      `<div><span>${game.i18n.localize(
        'TalentPsionics.Power.Order.IncreasePrompt'
      )}</span>${select}</div>`
    );

  html.height(html.height() + 20);
});

Hooks.on('dnd5e.preItemUsageConsumption', (item, config, options) => {
  if (item.type === typePower && config.increasedOrder) {
    const newOrder = Number(config.increasedOrder);
    if (newOrder > config.order) {
      item = item.clone({ 'system.order': newOrder }, { keepId: true });
      item.prepareData();
      item.prepareFinalAttributes();
    }
    foundry.utils.mergeObject(options.flags, {
      [moduleID + '.powerOrder']: item.system.order,
    });
  }
});

Hooks.on('dnd5e.preDisplayCard', (item, chatData, options) => {
  if (
    item.type !== typePower ||
    item.system.order >= options.flags[moduleID]?.powerOrder
  )
    return;
  chatData.content = chatData.content.replace(
    game.i18n.localize(`TalentPsionics.Power.Order.${item.system.order}`),
    game.i18n.localize(
      `TalentPsionics.Power.Order.${options.flags[moduleID].powerOrder}`
    )
  );
});

Hooks.on('renderChatMessage', (app, html, context) => {
  const trueOrder = app.getFlag(moduleID, 'powerOrder');
  if (trueOrder === undefined) return;
  const damage = html.find("button[data-action='damage']");
  if (damage.length) damage[0].dataset['powerOrder'] = trueOrder;
});

/**
 * SCALING
 */

Hooks.on('dnd5e.preRollDamage', (item, rollConfig) => {
  if (item.type !== typePower) return;
  const firstRoll = rollConfig.rollConfigs[0];
  if (item.system.scaling.mode === 'order1') {
    let level;
    if (rollConfig.actor.type === 'character')
      level = rollConfig.actor.system.details.level;
    else if (item.system.preparation.mode === 'innate')
      level = Math.ceil(rollConfig.actor.system.details.cr);
    else level = rollConfig.actor.system.details.spellLevel;
    const add = Math.floor((level + 1) / 6);
    if (add === 0) return;

    scaleDamage(
      firstRoll.parts,
      item.system.scaling.formula || firstRoll.parts.join(' + '),
      add,
      rollConfig.data
    );
  } else if (
    item.system.scaling.formula &&
    item.system.scaling.mode === 'order'
  ) {
    const trueOrder = Number(rollConfig.event.target.dataset['powerOrder']);
    if (trueOrder === NaN) return;
    const baseOrder = item.system.order;
    const increasedOrder = Math.max(0, trueOrder - baseOrder);
    if (increasedOrder === 0) return;
    scaleDamage(
      firstRoll.parts,
      item.system.scaling.formula,
      increasedOrder,
      rollConfig.data
    );
  }
});
/**
 * Scale an array of damage parts according to a provided scaling formula and scaling multiplier.
 * @param {string[]} parts    The original parts of the damage formula.
 * @param {string} scaling    The scaling formula.
 * @param {number} times      A number of times to apply the scaling formula.
 * @param {object} rollData   A data object that should be applied to the scaled damage roll
 * @returns {string[]}        The parts of the damage formula with the scaling applied.
 * @private
 */
function scaleDamage(parts, scaling, times, rollData) {
  if (times <= 0) return parts;
  const p0 = new Roll(parts[0], rollData);
  const s = new Roll(scaling, rollData).alter(times);

  // Attempt to simplify by combining like dice terms
  let simplified = false;
  if (s.terms[0] instanceof Die && s.terms.length === 1) {
    const d0 = p0.terms[0];
    const s0 = s.terms[0];
    if (
      d0 instanceof Die &&
      d0.faces === s0.faces &&
      d0.modifiers.equals(s0.modifiers)
    ) {
      d0.number += s0.number;
      parts[0] = p0.formula;
      simplified = true;
    }
  }

  // Otherwise, add to the first part
  if (!simplified) parts[0] = `${parts[0]} + ${s.formula}`;
  return parts;
}

/**
 *
 * STRAIN TAB
 *
 */

Handlebars.registerHelper('plus', function (a, b) {
  return Number(a) + Number(b);
});

let lastUpdatedStrainActorId = null;

Hooks.on('renderActorSheet5eCharacter', async (sheet, html, data) => {
  await addStrainTab(sheet, html, data.actor);
  if (
    lastUpdatedStrainActorId === sheet.actor.id ||
    sheet._tabs[0]?.active == 'strain'
  ) {
    sheet.activateTab('strain');
  }
});

Hooks.on('updateActor', (actor, data, options, id) => {
  saveActorIdOnStrainTab(actor);
});

Hooks.on('dnd5e.prepareLeveledSlots', (spells, actor, slots) => {
  if (!game.ready) return;
  saveActorIdOnStrainTab(actor);
});

function saveActorIdOnStrainTab(actor) {
  if (actor?.sheet._tabs[0]?.active == 'strain') {
    lastUpdatedStrainActorId = actor._id;
  } else {
    lastUpdatedStrainActorId = null;
  }
}
