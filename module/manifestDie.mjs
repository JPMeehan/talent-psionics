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
    const order = this.item.system.order + config.scaling;
    const flavor = game.i18n.format("TalentPsionics.Power.ManifestDieFlavor", {order}); 
    const roll = foundry.dice.Roll.create(scalar.formula, {}, {flavor});
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
    const order = Number(this.item.system.order ?? 0) + Number(config.scaling ?? 0);

    return {
      label: game.i18n.localize("TalentPsionics.Power.RollManifestDieLabel"),
      hint: game.i18n.format("TalentPsionics.Power.RollManifestDieHint", {manifestDie, order})
    };
  }

  /**
   * Additional scaling modes for this consumption type in
   * addition to the default "amount" scaling.
   * Not currently used
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
 * Configuration data for an activity usage being prepared.
 *
 * @typedef {object} ActivityUseConfiguration
 * @property {object|false} create
 * @property {boolean} create.measuredTemplate     Should this item create a template?
 * @property {object} concentration
 * @property {boolean} concentration.begin         Should this usage initiate concentration?
 * @property {string|null} concentration.end       ID of an active effect to end concentration on.
 * @property {object|false} consume
 * @property {boolean|number[]} consume.resources  Set to `true` or `false` to enable or disable all resource
 *                                                 consumption or provide a list of consumption target indexes
 *                                                 to only enable those targets.
 * @property {boolean} consume.spellSlot           Should this spell consume a spell slot?
 * @property {Event} event                         The browser event which triggered the item usage, if any.
 * @property {boolean|number} scaling              Number of steps above baseline to scale this usage, or `false` if
 *                                                 scaling is not allowed.
 * @property {object} spell
 * @property {number} spell.slot                   The spell slot to consume.
 */

/**
 * Update data produced by activity usage.
 *
 * @typedef {object} ActivityUsageUpdates
 * @property {object} activity  Updates applied to activity that performed the activation.
 * @property {object} actor     Updates applied to the actor that performed the activation.
 * @property {string[]} delete  IDs of items to be deleted from the actor.
 * @property {object[]} item    Updates applied to items on the actor that performed the activation.
 * @property {Roll[]} rolls     Any rolls performed as part of the activation.
 */

/**
 * @typedef {Object} FormSelectOption
 * @property {string} [value]
 * @property {string} [label]
 * @property {string} [group]
 * @property {boolean} [disabled]
 * @property {boolean} [selected]
 * @property {boolean} [rule]
 */
