export const ACTOR_SHEETS = {
  LEGACY_CHARACTER: 'ActorSheet5eCharacter',
  LEGACY_NPC: 'ActorSheet5eNPC',
  DEFAULT_CHARACTER: 'ActorSheet5eCharacter2',
  DEFAULT_NPC: 'ActorSheet5eNPC2',
  TIDY5E: 'Tidy5eSheet',
};

export const moduleID = 'talent-psionics';
export const typePower = moduleID + '.power';
export const STRAIN_FLAG = 'strain';

export function calculateMaxStrain(actor) {
  return actor.classes?.talent?.system?.levels + 4;
}
