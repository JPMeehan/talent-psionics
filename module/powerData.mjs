import { typePower } from "./utils.mjs";

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
  dnd5e.dataModels.item.ActivitiesTemplate,
) {
  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DND5E.ACTIVATION", "DND5E.DURATION", "DND5E.RANGE", "DND5E.TARGET"
  ];

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      activation: new dnd5e.dataModels.shared.ActivationField(),
      duration: new dnd5e.dataModels.shared.DurationField(),
      range: new dnd5e.dataModels.shared.RangeField(),
      target: new dnd5e.dataModels.shared.TargetField(),
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
      sourceClass: new foundry.data.fields.StringField({ label: "DND5E.SpellSourceClass" })
    });
  }

  /** @override */
  static get compendiumBrowserFilters() {
    return new Map([
      ["order", {
        label: 'TalentPsionics.Power.Order.Label',
        type: "range",
        config: {
          keyPath: "system.order",
          min: 0,
          max: Object.keys(CONFIG.TALENT_PSIONICS.powerOrders).length - 1
        }
      }],
      ["specialty", {
        label: "TalentPsionics.Power.Spec.Label",
        type: "set",
        config: {
          choices: CONFIG.TALENT_PSIONICS.specialties,
          keyPath: "system.specialty"
        }
      }],
      ["properties", this.compendiumBrowserPropertiesFilter(typePower)]
    ]);
  }

  /* -------------------------------------------- */
  /*  Data Migrations                             */
  /* -------------------------------------------- */

  /** @inheritDoc */
  static _migrateData(source) {
    super._migrateData(source);
    ActivitiesTemplate.migrateActivities(source);
    PowerData.#migrateActivation(source);
    PowerData.#migrateTarget(source);
  }
  /**
   * Migrate activation data.
   * Added in DnD5e 4.0.0.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateActivation(source) {
    if ( source.activation?.cost ) source.activation.value = source.activation.cost;
  }

  /* -------------------------------------------- */

  /**
   * Migrate target data.
   * Added in DnD5e 4.0.0.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateTarget(source) {
    if ( !("target" in source) ) return;
    source.target.affects ??= {};
    source.target.template ??= {};

    if ( "units" in source.target ) source.target.template.units = source.target.units;
    if ( "width" in source.target ) source.target.template.width = source.target.width;

    const type = source.target.type ?? source.target.template.type ?? source.target.affects.type;
    if ( type in CONFIG.DND5E.areaTargetTypes ) {
      if ( "type" in source.target ) source.target.template.type = type;
      if ( "value" in source.target ) source.target.template.size = source.target.value;
    } else if ( type in CONFIG.DND5E.individualTargetTypes ) {
      if ( "type" in source.target ) source.target.affects.type = type;
      if ( "value" in source.target ) source.target.affects.count = source.target.value;
    }
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
      concentration: CONFIG.DND5E.itemProperties.concentration,
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

    // Necessary because excluded from valid types in Item5e#_prepareProficiency
    if ( !this.parent.actor?.system.attributes?.prof ) {
      this.prof = new dnd5e.documents.Proficiency(0, 0);
      return;
    }

    this.prof = new dnd5e.documents.Proficiency(this.parent.actor.system.attributes.prof, this.proficiencyMultiplier ?? 0);
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
