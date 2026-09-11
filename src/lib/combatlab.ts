/** Weapons already in Combat Lab's catalog (data.js). Script IDs, not DisplayName. */
export const COMBAT_IDS = new Set([
	'Axe',
	'WoodAxe',
	'HandAxe',
	'AxeStone',
	'Crowbar',
	'BaseballBat',
	'BaseballBat_Nails',
	'Sledgehammer',
	'Shovel',
	'LeadPipe',
	'Hammer',
	'PipeWrench',
	'Nightstick',
	'Pan',
	'Katana',
	'Machete',
	'HuntingKnife',
	'KitchenKnife',
	'MeatCleaver',
	'Screwdriver',
	'SpearCrafted',
	'SpearCraftedFireHardened',
	'SpearHuntingKnife',
	'SpearKnife',
	'Shotgun',
	'ShotgunSawnoff',
	'DoubleBarrelShotgun',
	'Pistol',
	'Pistol2',
	'Revolver_Long',
	'HuntingRifle',
	'AssaultRifle',
	'AssaultRifle2'
]);

export const COMBAT_LAB_URL = 'https://ioshiro.github.io/CombatLab/';

/** Armory skillKey → Combat Lab category chip. */
export const SKILL_TO_COMBAT: Record<string, string> = {
	'base:axe': 'Axe',
	'base:blunt': 'Blunt',
	'base:smallblunt': 'SmallBlunt',
	'base:smallblade': 'SmallBlade',
	'base:longblade': 'LongBlade',
	'base:spear': 'Spear',
	firearm: 'Firearm',
	unarmed: 'Unarmed'
};

export function inCombatLab(id: string): boolean {
	return COMBAT_IDS.has(id);
}

export function combatLabHref(id: string, rpg = false): string {
	const u = new URL(COMBAT_LAB_URL);
	u.searchParams.set('weapon', id);
	if (rpg) u.searchParams.set('rpg', '1');
	return u.toString();
}
