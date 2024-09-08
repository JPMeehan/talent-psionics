/**
 * Class implementing the new ActivityConsumptionTargetConfig using static members
 */
export default class ManifestDie {
  /**
     * Localized label for the target type.
     */
  static get label() {
    return "TalentPsionics.Power.ManifestDie";
  }

  /**
     * Function used to consume according to this type.
     * @this {InstanceType<dnd5e["dataModels"]["activity"]["ConsumptionTargetData"]>}
     * @param {ActivityUseConfiguration} config  Configuration data for the activity usage.
     * @param {ActivityUsageUpdates} updates     Updates to be performed.
     */
  static async consume(config, updates) {
    const scalar = foundry.utils.getProperty(this.actor.system.scale, this.target);
    if (!(scalar instanceof dnd5e.dataModels.advancement.scaleValue.ScaleValueTypeDice)) return;
    const formula = scalar.formula + " - @order" + `[${game.i18n.localize("TalentPsionics.Power.Order.Label")}]`;
    const order = this.item.system.order + config.scaling;
    const flavor = game.i18n.localize("TalentPsionics.Power.ManifestDie"); 
    const roll = foundry.dice.Roll.create(formula, {order}, {flavor});
    updates.rolls.push(roll);
    return roll.toMessage({speaker: {actor: this.actor}, flavor});
  }

  /**
     * Function used to generate a hint of consumption amount.
     * @this {InstanceType<dnd5e["dataModels"]["activity"]["ConsumptionTargetData"]>}
     * @param {ActivityUseConfiguration} config    Configuration data for the activity usage.
     * @returns {{ label: string, hint: string }}  Label and hint text.
     */
  static consumptionLabels(config) {
    const scalar = foundry.utils.getProperty(this.actor.system.scale, this.target);
    const manifestDie = scalar?.formula ?? "";

    return {
      label: game.i18n.localize("TalentPsionics.Power.RollManifestDieLabel"),
      hint: game.i18n.format("TalentPsionics.Power.RollManifestDieHint", {manifestDie})
    };
  }

  /**
     * Additional scaling modes for this consumption type in
     * addition to the default "amount" scaling.
     */
  static get scalingModes() {
    return [
      {
        value: "order",
        label: "TalentPsionics.Power.Order.Label"
      }
    ];
  }

  /**
     * Use text input rather than select when not embedded.
     */
  static get targetRequiresEmbedded() {
    return true;
  }

  /**
     * Generate a list of targets for the "Manifestation Die" consumption type.
     * @this {InstanceType<dnd5e["dataModels"]["activity"]["ConsumptionTargetData"]>}
     * @returns {FormSelectOption[]}
     */
  static validTargets() {
    const targets = [];
    if (!this.actor) return targets;
    for (const [className, scalars] of Object.entries(this.actor.system.scale)) {
      for (const [scaleName, scale] of Object.entries(scalars)) {
        if (!(scale instanceof dnd5e.dataModels.advancement.scaleValue.ScaleValueTypeDice)) continue;
        targets.push({
          value: `${className}.${scaleName}`,
          label: scale.parent.title
        });
      }
    }
    return targets;
  }
}

/**
 * @typedef {Object} FormSelectOption
 * @property {string} [value]
 * @property {string} [label]
 * @property {string} [group]
 * @property {boolean} [disabled]
 * @property {boolean} [selected]
 * @property {boolean} [rule]
 */
