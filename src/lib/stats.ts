import type { Cue, MetricKey, Weapon } from './types';
import { metricValue } from './labels';

export function matchesCue(w: Weapon, cue: Cue): boolean {
	if (cue === 'all') return true;
	if (cue === 'debug') return w.debug || w.skillKey === 'debug';
	if (cue === 'firearm') return w.family === 'firearm';
	if (cue === 'explosive') return w.family === 'explosive' || w.family === 'thrown';
	if (cue === 'melee') return w.family === 'melee' || w.family === 'unarmed';
	return true;
}

export function quantile(sorted: number[], q: number): number {
	if (sorted.length === 0) return 0;
	if (sorted.length === 1) return sorted[0];
	const pos = (sorted.length - 1) * q;
	const lo = Math.floor(pos);
	const hi = Math.ceil(pos);
	if (lo === hi) return sorted[lo];
	return sorted[lo] * (hi - pos) + sorted[hi] * (pos - lo);
}

export type Box = {
	n: number;
	min: number;
	q1: number;
	median: number;
	q3: number;
	max: number;
	iqr: number;
	mean: number;
	fenceLo: number;
	fenceHi: number;
	outliers: { weapon: Weapon; value: number }[];
	inliers: number[];
};

export function boxplot(weapons: Weapon[], key: MetricKey): Box | null {
	const pairs: { weapon: Weapon; value: number }[] = [];
	for (const w of weapons) {
		const v = metricValue(w, key);
		if (v == null || Number.isNaN(v)) continue;
		pairs.push({ weapon: w, value: v });
	}
	if (pairs.length === 0) return null;
	const sorted = [...pairs].sort((a, b) => a.value - b.value);
	const values = sorted.map((p) => p.value);
	const q1 = quantile(values, 0.25);
	const median = quantile(values, 0.5);
	const q3 = quantile(values, 0.75);
	const iqr = q3 - q1;
	const fenceLo = q1 - 1.5 * iqr;
	const fenceHi = q3 + 1.5 * iqr;
	const outliers = sorted.filter((p) => p.value < fenceLo || p.value > fenceHi);
	const inliers = values.filter((v) => v >= fenceLo && v <= fenceHi);
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	return {
		n: values.length,
		min: values[0],
		q1,
		median,
		q3,
		max: values[values.length - 1],
		iqr,
		mean,
		fenceLo,
		fenceHi,
		outliers,
		inliers: inliers.length ? inliers : values
	};
}

export function groupBySkill(weapons: Weapon[]): Map<string, Weapon[]> {
	const m = new Map<string, Weapon[]>();
	for (const w of weapons) {
		const k = w.skillKey;
		const list = m.get(k);
		if (list) list.push(w);
		else m.set(k, [w]);
	}
	return m;
}

export function topAlerts(weapons: Weapon[], key: MetricKey, n = 5): { weapon: Weapon; value: number; z: number }[] {
	const pairs: { weapon: Weapon; value: number }[] = [];
	for (const w of weapons) {
		const v = metricValue(w, key);
		if (v == null) continue;
		pairs.push({ weapon: w, value: v });
	}
	if (pairs.length < 3) {
		return pairs
			.sort((a, b) => b.value - a.value)
			.slice(0, n)
			.map((p) => ({ ...p, z: 0 }));
	}
	const mean = pairs.reduce((a, b) => a + b.value, 0) / pairs.length;
	const sd = Math.sqrt(pairs.reduce((a, b) => a + (b.value - mean) ** 2, 0) / pairs.length) || 1;
	return pairs
		.map((p) => ({ ...p, z: (p.value - mean) / sd }))
		.sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
		.slice(0, n);
}

export function extent(values: number[]): [number, number] {
	if (!values.length) return [0, 1];
	let lo = values[0];
	let hi = values[0];
	for (const v of values) {
		if (v < lo) lo = v;
		if (v > hi) hi = v;
	}
	if (lo === hi) return [lo - 1, hi + 1];
	const pad = (hi - lo) * 0.06;
	return [lo - pad, hi + pad];
}
