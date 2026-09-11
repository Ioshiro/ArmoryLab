export type Family = 'melee' | 'firearm' | 'explosive' | 'thrown' | 'unarmed' | 'debug';

export type Derived = {
	avgDamage: number;
	expectedStanding: number;
	expectedFloor: number;
	combatSpeedUnskilled: number;
	damagePerWeight: number | null;
	expectedPerWeight: number | null;
	expectedHitsToBreak: number;
	enduranceSwingStrength5: number;
	rangeSpan: number;
	damageSpan: number;
};

export type Weapon = {
	id: string;
	fullType: string;
	displayName: string;
	displayCategory: string;
	categories: string[];
	primarySkill: string | null;
	improvised: boolean;
	subCategory: string | null;
	tags: string[];
	icon: string | null;
	weight: number;
	minDamage: number;
	maxDamage: number;
	avgDamage: number;
	baseSpeed: number;
	swingTime: number;
	minSwing: number;
	critChance: number;
	critMult: number;
	enduranceMod: number;
	knockdownMod: number;
	condChance: number;
	condMax: number;
	maxHit: number;
	maxRange: number;
	minRange: number;
	minAngle: number;
	pushBack: number;
	door: number;
	tree: number;
	weaponLength: number;
	twoHand: boolean;
	bothHands: boolean;
	ranged: boolean;
	aimedFirearm: boolean;
	knockBackOnNoDeath: boolean | null;
	alwaysKnockdown: boolean;
	damageMakeHole: boolean;
	damageCategory: string | null;
	sharpness: number | null;
	closeKillMove: string | null;
	attachmentType: string | null;
	swingAnim: string | null;
	ammoType: string | null;
	ammoBox: string | null;
	magazineType: string | null;
	maxAmmo: number | null;
	hitChance: number | null;
	aimingTime: number | null;
	reloadTime: number | null;
	recoilDelay: number | null;
	soundRadius: number | null;
	soundVolume: number | null;
	jamGunChance: number | null;
	projectileCount: number | null;
	fireMode: string | null;
	fireModes: string[];
	cyclicRate: number | null;
	piercing: boolean;
	explosionPower: number | null;
	explosionRange: number | null;
	explosionTimer: number | null;
	fireRange: number | null;
	smokeRange: number | null;
	noiseRange: number | null;
	canBePlaced: boolean;
	useSelf: boolean;
	physicsObject: string | null;
	metalValue: number | null;
	tooltip: string | null;
	debug: boolean;
	family: Family;
	skillKey: string;
	derived: Derived;
};

export type Dataset = {
	source: Record<string, unknown>;
	generatedAt: string;
	count: number;
	skillLabels: Record<string, string>;
	bySkill: Record<string, number>;
	byFamily: Record<string, number>;
	byDisplayCategory: Record<string, number>;
	weapons: Weapon[];
};

export type Cue =
	| 'all'
	| 'base:axe'
	| 'base:blunt'
	| 'base:smallblunt'
	| 'base:smallblade'
	| 'base:longblade'
	| 'base:spear'
	| 'firearm'
	| 'explosive'
	| 'unarmed'
	| 'debug';

export type MetricKey =
	| 'htkScript'
	| 'expectedStanding'
	| 'avgDamage'
	| 'weight'
	| 'baseSpeed'
	| 'maxRange'
	| 'critChance'
	| 'expectedHitsToBreak'
	| 'enduranceSwingStrength5'
	| 'door'
	| 'soundRadius'
	| 'maxHit';
