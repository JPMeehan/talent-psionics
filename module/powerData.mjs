import { modulePath, typePower } from "./utils.mjs";

const { ItemDescriptionTemplate, ActivitiesTemplate } = dnd5e.dataModels.item;
const {ActivationField, DurationField, RangeField, TargetField} = dnd5e.dataModels.shared

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
  ItemDescriptionTemplate,
  ActivitiesTemplate,
) {
  /** @override */
  static LOCALIZATION_PREFIXES = [
    "DND5E.ACTIVATION", "DND5E.DURATION", "DND5E.RANGE", "DND5E.SOURCE", "DND5E.TARGET"
  ];

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      activation: new ActivationField(),
      duration: new DurationField(),
      range: new RangeField(),
      target: new TargetField(),
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

  /**
   * Add additional data shims for powers.
   */
  _applyPowerShims() {
    Object.defineProperty(this.activation, "cost", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `activation.cost` property on `PowerData` has been renamed `activation.value`.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return this.value;
      },
      configurable: true,
      enumerable: false
    });
    Object.defineProperty(this, "scaling", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `scaling` property on `PowerData` has been deprecated and is now handled by individual damage parts.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return { mode: "none", formula: null };
      },
      configurable: true,
      enumerable: false
    });
    Object.defineProperty(this.target, "value", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `target.value` property on `PowerData` has been split into `target.template.size` and `target.affects.count`.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return this.template.size || this.affects.count;
      },
      configurable: true,
      enumerable: false
    });
    Object.defineProperty(this.target, "width", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `target.width` property on `PowerData` has been moved to `target.template.width`.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return this.template.width;
      },
      configurable: true,
      enumerable: false
    });
    Object.defineProperty(this.target, "units", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `target.units` property on `PowerData` has been moved to `target.template.units`.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return this.template.units;
      },
      configurable: true,
      enumerable: false
    });
    Object.defineProperty(this.target, "type", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `target.type` property on `PowerData` has been split into `target.template.type` and `target.affects.type`.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return this.template.type || this.affects.type;
      },
      configurable: true,
      enumerable: false
    });
    const firstActivity = this.activities.contents[0] ?? {};
    Object.defineProperty(this.target, "prompt", {
      get() {
        foundry.utils.logCompatibilityWarning(
          "The `target.prompt` property on `PowerData` has moved into its activity.",
          { since: "DnD5e 4.0", until: "DnD5e 4.4", once: true }
        );
        return firstActivity.target?.prompt;
      },
      configurable: true,
      enumerable: false
    });
  }


  /* -------------------------------------------- */
  /*  Tooltips                                    */
  /* -------------------------------------------- */

  static ITEM_TOOLTIP_TEMPLATE =
    modulePath('templates/power-tooltip.hbs');

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

  /** @inheritDoc */
  async getSheetData(context) {
    context.subtitles = [
      { label: context.labels.order },
      { label: context.labels.school },
    ];
    context.talentPsionics = CONFIG.TALENT_PSIONICS
    context.properties.active = this.parent.labels?.components?.tags;
    context.parts = [modulePath("templates/details-power.hbs"), "dnd5e.field-uses"];
  }


  /* -------------------------------------------- */
  /*  Derived Data                                */
  /* -------------------------------------------- */

  prepareDerivedData() {
    ActivitiesTemplate._applyActivityShims.call(this);
    this._applyPowerShims();
    super.prepareDerivedData();
    this.prepareDescriptionData();
    
    this.duration.concentration = this.properties.has("concentration");
    this.properties.add('mgc');

    this.labels = this.parent.labels ??=  {};

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

  }

  /** @inheritDoc */
  prepareFinalData() {
    const rollData = this.parent.getRollData({ deterministic: true });
    const labels = this.parent.labels ??= {};
    this.prepareFinalActivityData();
    ActivationField.prepareData.call(this, rollData, labels);
    DurationField.prepareData.call(this, rollData, labels);
    RangeField.prepareData.call(this, rollData, labels);
    TargetField.prepareData.call(this, rollData, labels);

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
   * Attack classification of this spell.
   * @type {"spell"}
   */
  get attackClassification() {
    return "spell";
  }

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

  /** @inheritDoc */
  get scalingIncrease() {
    if ( this.order !== 0 ) return null;
    return Math.floor(((this.parent.actor?.system.cantripLevel?.(this.parent) ?? 0) + 1) / 6);
  }

  /** @inheritDoc */
  getRollData(...options) {
    const data = super.getRollData(...options);
    data.item.order = data.item.order + (this.parent.getFlag("dnd5e", "scaling") ?? 0);
    return data;
  }
}
