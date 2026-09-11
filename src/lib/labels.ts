import type { Cue, MetricKey, Weapon } from './types';

export const SKILL_ORDER = [
	'base:axe',
	'base:blunt',
	'base:smallblunt',
	'base:smallblade',
	'base:longblade',
	'base:spear',
	'firearm',
	'explosive',
	'thrown',
	'unarmed',
	'base:improvised',
	'debug'
] as const;

export const SKILL_IT: Record<string, string> = {
	'base:axe': 'Ascia',
	'base:blunt': 'Contundente 2H',
	'base:smallblunt': 'Contundente 1H',
	'base:smallblade': 'Lama corta',
	'base:longblade': 'Lama lunga',
	'base:spear': 'Lancia',
	firearm: 'Da fuoco',
	explosive: 'Esplosivo',
	thrown: 'Da lancio',
	unarmed: 'Mani nude',
	'base:improvised': 'Solo improvvisata',
	debug: 'Debug',
	uncategorized: 'Senza skill'
};

export const FAMILY_IT: Record<string, string> = {
	melee: 'Mischia',
	firearm: 'Da fuoco',
	explosive: 'Esplosivo',
	thrown: 'Da lancio',
	unarmed: 'Mani nude',
	debug: 'Debug'
};

export const CUE_IT: Record<Cue, string> = {
	all: 'TUTTO',
	melee: 'MISCHIA',
	firearm: 'DA FUOCO',
	explosive: 'ESPLOSIVI',
	debug: 'DEBUG'
};

export const METRIC_IT: Record<MetricKey, { short: string; long: string; unit: string; cite: string }> = {
	expectedStanding: {
		short: 'Danno atteso in piedi',
		long: 'Danno medio × (1 + pCrit × (max(2, CritDmg) − 1)) — colpo in piedi, non aimAtFloor',
		unit: '',
		cite: 'IsoGameCharacter.Hit: crit moltiplica max(2, getCriticalDamageMultiplier())'
	},
	avgDamage: {
		short: 'Danno medio',
		long: '(MinDamage + MaxDamage) / 2',
		unit: '',
		cite: 'CombatManager: Rand.Next(min, max)'
	},
	weight: {
		short: 'Peso',
		long: 'Weight script',
		unit: '',
		cite: 'Item.Weight'
	},
	baseSpeed: {
		short: 'BaseSpeed',
		long: 'Moltiplicatore velocità combattimento',
		unit: '×',
		cite: 'calculateCombatSpeed: 0.8 × BaseSpeed, clamp 0.8–1.6 (skill 0, no rand)'
	},
	maxRange: {
		short: 'Gittata',
		long: 'MaxRange',
		unit: '',
		cite: 'HandWeapon.maxRange'
	},
	critChance: {
		short: 'Crit %',
		long: 'CriticalChance script (sharpness non applicata)',
		unit: '%',
		cite: 'Item.criticalChance default 20'
	},
	expectedHitsToBreak: {
		short: 'Colpi a rottura',
		long: 'ConditionMax × ConditionLowerChanceOneIn',
		unit: '',
		cite: 'stima: ogni colpo 1/N, indipendente, MaxHit non modellato'
	},
	enduranceSwingStrength5: {
		short: 'Strain swing',
		long: 'Strain muscolare per swing (Strength 5, 1 hit)',
		unit: '',
		cite: 'IsoGameCharacter muscle strain: weight×0.15×EnduranceMod×0.3×4×2×0.65, ×0.5 se 2H'
	},
	door: {
		short: 'Porte',
		long: 'DoorDamage',
		unit: '',
		cite: 'Item.doorDamage'
	},
	soundRadius: {
		short: 'Raggio suono',
		long: 'SoundRadius (armi da fuoco)',
		unit: '',
		cite: 'HandWeapon.soundRadius — assente sulle melee'
	},
	maxHit: {
		short: 'Max hit',
		long: 'MaxHitcount',
		unit: '',
		cite: 'Item.maxHitCount default 1000'
	}
};

export const DISPLAY_IT: Record<string, string> = {
	Weapon: 'Arma',
	WeaponCrafted: 'Craftata',
	ToolWeapon: 'Utensile',
	Explosives: 'Esplosivi',
	CookingWeapon: 'Cucina',
	MaterialWeapon: 'Materiale',
	HouseholdWeapon: 'Domestica',
	JunkWeapon: 'Junk',
	SportsWeapon: 'Sport',
	GardeningWeapon: 'Giardinaggio',
	InstrumentWeapon: 'Strumento',
	AnimalPartWeapon: 'Osso/parte',
	BrokenWeapon: 'Rotta',
	Memento: 'Memento',
	FishingWeapon: 'Pesca',
	Gardening: 'Giardinaggio',
	Fishing: 'Pesca',
	VehicleMaintenanceWeapon: 'Officina',
	Hidden: 'Nascosta',
	FirstAidWeapon: 'Pronto soccorso',
	WeaponImprovised: 'Improvvisata'
};

export function skillLabel(key: string): string {
	return SKILL_IT[key] ?? key;
}

export function metricValue(w: Weapon, key: MetricKey): number | null {
	switch (key) {
		case 'expectedStanding':
			return w.derived.expectedStanding;
		case 'avgDamage':
			return w.avgDamage;
		case 'weight':
			return w.weight;
		case 'baseSpeed':
			return w.baseSpeed;
		case 'maxRange':
			return w.maxRange;
		case 'critChance':
			return w.critChance;
		case 'expectedHitsToBreak':
			return w.derived.expectedHitsToBreak;
		case 'enduranceSwingStrength5':
			return w.derived.enduranceSwingStrength5;
		case 'door':
			return w.door;
		case 'soundRadius':
			return w.soundRadius;
		case 'maxHit':
			return w.maxHit;
	}
}

export function formatNum(n: number | null | undefined, digits = 2): string {
	if (n == null || Number.isNaN(n)) return '—';
	if (Math.abs(n) >= 100) return n.toFixed(0);
	if (Math.abs(n) >= 10) return n.toFixed(1);
	return n.toFixed(digits);
}
