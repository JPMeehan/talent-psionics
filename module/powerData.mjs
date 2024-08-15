/**
 * Data definition for Power items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {number} order                      Base order of the power.
 * @property {string} specialty                  Psionic specialty to which this power belongs.
 * @property {Set<string>} properties            General components and tags for this power.
 * @property {object} scaling                    Details on how casting at higher orders affects this power.
 * @property {string} scaling.mode               Power scaling mode as defined in `TALENT_PSIONICS.powerScalingModes`.
 * @property {string} scaling.formula            Dice formula used for scaling.
 */
export default class PowerData extends dnd5e.dataModels.ItemDataModel.mixin(
  dnd5e.dataModels.item.ItemDescriptionTemplate,
  dnd5e.dataModels.item.ActivatedEffectTemplate,
  dnd5e.dataModels.item.ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      order: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        initial: 1,
        min: 0,
        label: 'TalentPsionics.Power.Order.Label',
      }),
      specialty: new foundry.data.fields.StringField({
        required: true,
        label: 'TalentPsionics.Power.Spec.Label',
      }),
      properties: new foundry.data.fields.SetField(
        new foundry.data.fields.StringField(),
        { label: 'DND5E.Properties' }
      ),
      scaling: new foundry.data.fields.SchemaField(
        {
          mode: new foundry.data.fields.StringField({
            required: true,
            initial: 'none',
            label: 'DND5E.ScalingMode',
          }),
          formula: new dnd5e.dataModels.fields.FormulaField({
            required: true,
            nullable: true,
            initial: null,
            label: 'DND5E.ScalingFormula',
          }),
        },
        { label: 'DND5E.LevelScaling' }
      ),
    });
  }

  /* -------------------------------------------- */
  /*  Tooltips                                    */
  /* -------------------------------------------- */

  static ITEM_TOOLTIP_TEMPLATE =
    'modules/talent-psionics/templates/power-tooltip.hbs';

  async getCardData(enrichmentOptions = {}) {
    const context = await super.getCardData(enrichmentOptions);
    context.psionics = CONFIG.TALENT_PSIONICS;
    context.specialty = this.specialty;
    context.isSpell = true;
    context.tags = this.labels.components.tags;
    context.subtitle = [this.labels.order, this.labels.school].filterJoin(
      ' &bull; '
    );
    return context;
  }

  async getFavoriteData() {
    return foundry.utils.mergeObject(await super.getFavoriteData(), {
      subtitle: [this.parent.labels.activation],
      modifier: this.parent.labels.modifier,
      range: this.range,
      save: this.save,
    });
  }

  /* -------------------------------------------- */
  /*  Derived Data                                */
  /* -------------------------------------------- */

  prepareDerivedData() {
    this.labels = {};

    const tags = {
      concentration: { ...CONFIG.DND5E.spellTags.concentration, tag: true },
    };
    const attributes = { ...tags };
    this.labels.order = CONFIG.TALENT_PSIONICS.powerOrders[this.order];
    this.labels.school =
      CONFIG.TALENT_PSIONICS.specialties[this.specialty]?.label;
    this.labels.components = this.properties.reduce(
      (obj, c) => {
        const config = attributes[c];
        if (!config) return obj;
        const { abbr, label, icon } = config;
        obj.all.push({ abbr, label, icon, tag: config.tag });
        if (config.tag) obj.tags.push(config.label);
        return obj;
      },
      { all: [], tags: [] }
    );

    this.properties.add('mgc');
  }

  /** @inheritDoc */
  prepareFinalData() {
    this.prepareFinalActivatedEffectData();
  }


  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    let properties = [this.labels.order];

    return [...properties, ...this.labels.components.tags];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    return this.parent?.actor?.system.attributes.spellcasting || 'int';
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.dnd5e?.spellCriticalThreshold ?? Infinity;
  }

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    return 1;
  }
}
