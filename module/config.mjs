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
PP_CONFIG.PSIONICS.specialties = {
  chr: {
    label: 'TalentPsionics.Spec.Chron',
    icon: 'modules/talent-psionics/assets/icons/chronopathy.svg',
    fullKey: 'chronopathy',
  },
  mtm: {
    label: 'TalentPsionics.Spec.Meta',
    icon: 'modules/talent-psionics/assets/icons/metamorphosis.svg',
    fullKey: 'metamorphosis',
  },
  pyr: {
    label: 'TalentPsionics.Spec.Pyro',
    icon: 'modules/talent-psionics/assets/icons/pyrokinesis.svg',
    fullKey: 'pyrokinesis',
  },
  res: {
    label: 'TalentPsionics.Spec.Reso',
    icon: 'modules/talent-psionics/assets/icons/resopathy.svg',
    fullKey: 'resopathy',
  },
  tlk: {
    label: 'TalentPsionics.Spec.Tlk',
    icon: 'modules/talent-psionics/assets/icons/telekinesis.svg',
    fullKey: 'telekinesis',
  },
  tlp: {
    label: 'TalentPsionics.Spec.Tlp',
    icon: 'modules/talent-psionics/assets/icons/telepathy.svg',
    fullKey: 'telepathy',
  },
};

export default TP_CONFIG;
