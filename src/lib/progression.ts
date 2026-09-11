import type { MetricKey, Weapon } from './types';
import { metricValue } from './labels';
import { groupBySkill } from './stats';
import { SKILL_ORDER } from './labels';

export const BANDS = [1, 2, 3, 4, 5, 6] as const;
export type Band = (typeof BANDS)[number];

/** Shambler Normal mean HP (Combat Lab toughness 2 / vanilla 1.8–2.1). */
export const SHAMBLER_HP = 1.95;

export type Ranked = {
	weapon: Weapon;
	value: number;
	rank: number;
	n: number;
	percentile: number;
	band: Band;
};

/** Higher script damage → later band (T6 = top sixth). Equal-count, not equal-width. */
export function rankByPower(weapons: Weapon[]): Ranked[] {
	const pairs: { weapon: Weapon; value: number }[] = [];
	for (const w of weapons) {
		const value = metricValue(w, 'expectedStanding');
		if (value == null) continue;
		pairs.push({ weapon: w, value });
	}
	pairs.sort((a, b) => a.value - b.value || a.weapon.id.localeCompare(b.weapon.id));
	const n = pairs.length;
	return pairs.map((p, i) => {
		const band = n === 0 ? 1 : (Math.min(6, Math.floor((i / n) * 6) + 1) as Band);
		return {
			weapon: p.weapon,
			value: p.value,
			rank: i + 1,
			n,
			percentile: n <= 1 ? 1 : i / (n - 1),
			band
		};
	});
}

export function rankIndex(weapons: Weapon[]): Map<string, Ranked> {
	return new Map(rankByPower(weapons).map((r) => [r.weapon.id, r]));
}

export function laddersBySkill(weapons: Weapon[]): { skill: string; ranked: Ranked[]; bands: Record<Band, Ranked[]> }[] {
	const g = groupBySkill(weapons);
	return SKILL_ORDER.filter((k) => (g.get(k)?.length ?? 0) > 0).map((skill) => {
		const ranked = rankByPower(g.get(skill) ?? []);
		const bands = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } as Record<Band, Ranked[]>;
		for (const r of ranked) bands[r.band].push(r);
		return { skill, ranked, bands };
	});
}

export function htkScript(w: Weapon, hp = SHAMBLER_HP): number | null {
	const d = w.derived.expectedStanding;
	if (d == null || d <= 0) return null;
	return hp / d;
}

export function sourceOf(w: Weapon): 'crafted' | 'improvised' | 'tool' | 'junk' | 'loot' {
	if (w.displayCategory === 'WeaponCrafted') return 'crafted';
	if (w.improvised || w.displayCategory === 'WeaponImprovised') return 'improvised';
	if (w.displayCategory === 'ToolWeapon' || w.displayCategory === 'VehicleMaintenanceWeapon') return 'tool';
	if (w.displayCategory === 'JunkWeapon' || w.displayCategory === 'BrokenWeapon') return 'junk';
	return 'loot';
}

export type SourceCue = 'all' | 'loot' | 'crafted' | 'improvised' | 'tool' | 'junk';

export const SOURCE_IT: Record<SourceCue, string> = {
	all: 'Tutte',
	loot: 'Loot',
	crafted: 'Craft',
	improvised: 'Improv.',
	tool: 'Utensile',
	junk: 'Junk'
};

export function matchesSource(w: Weapon, source: SourceCue): boolean {
	if (source === 'all') return true;
	return sourceOf(w) === source;
}

export function metricDirection(key: MetricKey): 'low' | 'high' {
	if (key === 'htkScript' || key === 'enduranceSwingStrength5' || key === 'weight') return 'low';
	return 'high';
}
