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
