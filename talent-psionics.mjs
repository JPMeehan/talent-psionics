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
