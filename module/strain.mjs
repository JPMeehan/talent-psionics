import {
  CUSTOM_SHEETS,
  moduleID,
  STRAIN_FLAG,
  calculateMaxStrain,
} from './utils.mjs';

export async function addStrainTab(sheet, html, actor) {
  /** @type {string[]} */
  const STRAIN_TYPES = CONFIG.TALENT_PSIONICS.strainTypes;

  if (actor.classes.talent === undefined) {
    return;
  }

  if (actor.flags[moduleID] === undefined) {
    await seedStrain(actor);
  }

  const strainName = game.i18n.localize('TalentPsionics.Strain.Label');

  let strainTab;
  if (isDefault5eSheet(sheet)) {
    strainTab = $('<a>')
      .addClass('item control')
      .attr('data-tab', 'strain')
      .attr('data-tooltip', strainName)
      .attr('aria-label', strainName)
      .append($('<i>').addClass('fas fa-brain'));
  } else {
    strainTab = $('<a>')
      .addClass('item')
      .attr('data-tab', 'strain')
      .text(strainName);
  }

  const resources = {};
  let totalStrain = 0;
  const maxStrain = getMaxStrain(actor);

  for (const type of STRAIN_TYPES) {
    const value = Number(actor.getFlag(moduleID, `${STRAIN_FLAG}.${type}`));
    const label = game.i18n.localize(
      `TalentPsionics.Strain.Table.${type}.label`
    );
    resources[type] = { type, value, label };
    totalStrain += value;
  }

  const remainingStrain = Number(maxStrain - totalStrain);

  const rows = [];
  const strainTypes = ['strain'].concat(STRAIN_TYPES);

  for (let i = 0; i < 9; i++) {
    const cells = [];
    for (let j = 0; j < 4; j++) {
      const type = strainTypes[j];
      let header;

      if (j === 0) {
        header = game.i18n.localize(`TalentPsionics.Strain.Label`);
      } else {
        header = game.i18n.format(`TalentPsionics.Strain.Table.Header`, {
          type: game.i18n.localize(`TalentPsionics.Strain.Table.${type}.label`),
        });
      }

      cells.push({
        type,
        header,
        label: game.i18n.localize(`TalentPsionics.Strain.Table.${type}.${i}`),
        enabled: i <= resources[type]?.value,
        disabled: i > resources[type]?.value + remainingStrain,
      });
    }
    rows.push({ cells, i });
  }

  const template_data = {
    total_strain_label: game.i18n.localize('TalentPsionics.Strain.Total'),
    maximum_strain_label: game.i18n.localize('TalentPsionics.Strain.Max'),
    total_strain: totalStrain,
    max_strain: maxStrain,
    remaining_strain: remainingStrain,
    resources,
    rows,
  };

  let template = `/modules/${moduleID}/templates/`;

  if (isDefault5eSheet(sheet)) {
    template += 'actor-strain.hbs';
  } else if (isTidy5eSheet(sheet)) {
    template += 'actor-strain-t5e.hbs';
  } else {
    template += 'actor-strain-legacy.hbs';
  }

  let strainBody = await renderTemplate(template, template_data);

  if (isDefault5eSheet(sheet)) {
    html.find('section.sheet-body section.tab-body').append($(strainBody));
    html.find("nav.tabs .item.control[data-tab='spells']").after(strainTab);
  } else {
    html.find('section.sheet-body').append($(strainBody));
    html.find('nav.tabs').append(strainTab);
  }

  html.find('a.strain-toggle:not(.disabled)').click(toggleOnClick.bind(actor));
}

async function toggleOnClick(event) {
  const field = event.currentTarget.previousElementSibling;
  const strain = this.getFlag(moduleID, STRAIN_FLAG);
  const currentValue = strain[field.name];
  let newValue = Number(field.value);

  if (currentValue == newValue) {
    newValue -= 1;
  }

  strain[field.name] = newValue;

  let totalStrain = 0;

  for (const type of CONFIG.TALENT_PSIONICS.strainTypes) {
    totalStrain += strain[type];
  }

  const newStrain = {
    [field.name]: newValue,
    total: totalStrain,
    max: calculateMaxStrain(this),
  };

  await this.setFlag(moduleID, STRAIN_FLAG, newStrain);
}

function isTidy5eSheet(sheet) {
  return sheet.constructor.name === CUSTOM_SHEETS.TIDY5E;
}

function isDefault5eSheet(sheet) {
  return sheet.constructor.name === CUSTOM_SHEETS.DEFAULT;
}

async function seedStrain(actor) {
  const strainTable = {
    body: 0,
    mind: 0,
    soul: 0,
    total: 0,
    max: calculateMaxStrain(actor),
  };

  await actor.setFlag(moduleID, STRAIN_FLAG, strainTable);
}

function getMaxStrain(actor) {
  const maxStrain = actor.getFlag(moduleID, `${STRAIN_FLAG}.max`);

  if (maxStrain === undefined) return calculateMaxStrain(actor);
  else return maxStrain;
}
