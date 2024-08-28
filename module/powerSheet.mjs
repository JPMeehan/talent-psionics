import { modulePath } from "./utils.mjs";

export default class PowerSheet extends dnd5e.applications.item.ItemSheet5e {
  get template() {
    return modulePath('templates/power-sheet.hbs');
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    context.psionics = CONFIG.TALENT_PSIONICS;
    context.powerComponents = {
      concentration: CONFIG.DND5E.itemProperties.concentration,
    };
    if (context.system.actionType === 'msak')
      context.itemProperties[0] = game.i18n.localize(
        'TalentPsionics.Power.Action.MPAK'
      );
    if (context.system.actionType === 'rsak')
      context.itemProperties[0] = game.i18n.localize(
        'TalentPsionics.Power.Action.RPAK'
      );

    context.powerScalingModes = CONFIG.TALENT_PSIONICS.powerScalingModes;

    foundry.utils.mergeObject(context, {
      labels: context.system.labels,
    });

    return context;
  }
}
