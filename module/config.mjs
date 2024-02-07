const typePower = 'talent-psionics.power';
const moduleID = 'talent-psionics';

const TP_CONFIG = {
  TALENT_PSIONICS: {},
  DND5E: {
    featureTypes: {
      class: {
        subtypes: {
          psionicExertion: 'DND5E.ClassFeature.PsionicExertion',
        },
      },
    },
    validProperties: {
      [typePower]: new Set(['concentration']),
    },
    defaultArtwork: {
      Item: {
        [typePower]: 'modules/talent-psionics/assets/icons/power.svg',
      },
    },
    sourceBooks: {
      'The Talent and Psionics': 'by MCDM Productions',
    },
  },
};

TP_CONFIG.TALENT_PSIONICS.powerScalingModes = {
  none: 'None',
  order1: 'TalentPsionics.Power.Scaling.Order1',
  order: 'TalentPsionics.Power.Scaling.Order2+',
};

/**
 * Disciplines to which a power can belong.
 * @typedef {object} PowerSpecialtyConfiguration
 * @property {string} label        Localized label.
 * @property {string} icon         Spell school icon.
 * @property {string} fullKey      Fully written key used as alternate for enrichers.
 * @property {string} [reference]  Reference to a rule page describing this school.
 */
TP_CONFIG.TALENT_PSIONICS.specialties = {
  chr: {
    label: 'TalentPsionics.Power.Spec.Chron',
    icon: 'modules/talent-psionics/assets/icons/chronopathy.svg',
    fullKey: 'chronopathy',
  },
  mtm: {
    label: 'TalentPsionics.Power.Spec.Meta',
    icon: 'modules/talent-psionics/assets/icons/metamorphosis.svg',
    fullKey: 'metamorphosis',
  },
  pyr: {
    label: 'TalentPsionics.Power.Spec.Pyro',
    icon: 'modules/talent-psionics/assets/icons/pyrokinesis.svg',
    fullKey: 'pyrokinesis',
  },
  res: {
    label: 'TalentPsionics.Power.Spec.Reso',
    icon: 'modules/talent-psionics/assets/icons/resopathy.svg',
    fullKey: 'resopathy',
  },
  tlk: {
    label: 'TalentPsionics.Power.Spec.Tlk',
    icon: 'modules/talent-psionics/assets/icons/telekinesis.svg',
    fullKey: 'telekinesis',
  },
  tlp: {
    label: 'TalentPsionics.Power.Spec.Tlp',
    icon: 'modules/talent-psionics/assets/icons/telepathy.svg',
    fullKey: 'telepathy',
  },
};

/**
 * Valid power orders.
 * @enum {string}
 */
TP_CONFIG.TALENT_PSIONICS.powerOrders = {
  1: 'TalentPsionics.Power.Order.1',
  2: 'TalentPsionics.Power.Order.2',
  3: 'TalentPsionics.Power.Order.3',
  4: 'TalentPsionics.Power.Order.4',
  5: 'TalentPsionics.Power.Order.5',
  6: 'TalentPsionics.Power.Order.6',
};

export default TP_CONFIG;
