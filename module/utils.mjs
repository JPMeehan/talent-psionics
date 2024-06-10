export const CUSTOM_SHEETS = {
  LEGACY: 'ActorSheet5eCharacter',
  DEFAULT: 'ActorSheet5eCharacter2',
  TIDY5E: 'Tidy5eSheet',
};

export const moduleID = 'talent-psionics';
export const typePower = moduleID + '.power';
export const STRAIN_FLAG = 'strain';

export function calculateMaxStrain(actor) {
  return actor.classes?.talent?.system?.levels + 4;
}
