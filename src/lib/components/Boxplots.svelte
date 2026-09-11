<script lang="ts">
	import type { MetricKey, Weapon } from '$lib/types';
	import { SKILL_ORDER, METRIC_IT, formatNum, skillLabel } from '$lib/labels';
	import { boxplot, groupBySkill } from '$lib/stats';

	let { weapons, metric }: { weapons: Weapon[]; metric: MetricKey } = $props();

	const groups = $derived.by(() => {
		const g = groupBySkill(weapons);
		return SKILL_ORDER.map((k) => {
			const list = g.get(k) ?? [];
			return { key: k, box: boxplot(list, metric), n: list.length };
		}).filter((row) => row.n > 0);
	});

	const global = $derived.by(() => {
		const boxes = groups.map((g) => g.box).filter(Boolean);
		if (!boxes.length) return { lo: 0, hi: 1 };
		const lows = boxes.map((b) => Math.min(b!.q1, b!.inliers[0] ?? b!.min));
		const highs = boxes.map((b) => Math.max(b!.q3, b!.inliers[b!.inliers.length - 1] ?? b!.q3));
		let lo = Math.min(...lows);
		let hi = Math.max(...highs);
		if (lo >= 0) lo = 0;
		if (lo === hi) {
			lo -= 1;
			hi += 1;
		}
		const pad = (hi - lo) * 0.08;
		return { lo: lo === 0 ? 0 : lo - pad, hi: hi + pad };
	});

	const rowH = 34;
	const labelW = 178;
	const plotW = 340;
	const W = 640;
	const H = $derived(groups.length * rowH + 28);

	function x(v: number): number {
		const span = global.hi - global.lo || 1;
		const clamped = Math.min(global.hi, Math.max(global.lo, v));
		return ((clamped - global.lo) / span) * plotW;
	}

	const cite = $derived(METRIC_IT[metric]);
</script>

<figure class="fig">
	<h2>Fig. 1 — {cite.short} per skill</h2>
	<p class="muted">
		{cite.long}. Scala condivisa sui baffi (IQR), non sugli estremi: i punti allarme restano
		fuori scala. {cite.cite}.
	</p>
	<svg viewBox="0 0 {W} {H}" role="img" aria-label="Boxplot {cite.short} per categoria skill">
		<title>Boxplot {cite.short} per skill, scala sui baffi</title>
		<defs>
			<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" stroke-width="1" />
			</pattern>
		</defs>
		{#each groups as row, i}
			{@const y = 16 + i * rowH}
			{@const b = row.box}
			<text x="0" y={y + 4} fill="currentColor" font-size="11">{skillLabel(row.key)} ({row.n})</text>
			{#if b}
				<g transform="translate({labelW}, 0)" color="#e4d2a8">
					<line
						x1={x(b.inliers[0] ?? b.q1)}
						y1={y}
						x2={x(b.inliers[b.inliers.length - 1] ?? b.q3)}
						y2={y}
						stroke="#b49a6c"
					/>
					<rect
						x={Math.min(x(b.q1), x(b.q3))}
						y={y - 7}
						width={Math.max(2, Math.abs(x(b.q3) - x(b.q1)))}
						height="14"
						fill="url(#hatch)"
						stroke="#e4d2a8"
					/>
					<line x1={x(b.median)} y1={y - 9} x2={x(b.median)} y2={y + 9} stroke="#e0b03a" stroke-width="2" />
					{#each b.outliers as o}
						{@const ox = o.value > global.hi ? plotW + 8 : o.value < global.lo ? -8 : x(o.value)}
						<circle cx={ox} cy={y} r="3" fill="#f08a78" />
						<title>{o.weapon.id} {formatNum(o.value)}</title>
					{/each}
					<text x={plotW + 28} y={y + 4} fill="#b49a6c" font-size="10">
						med {formatNum(b.median)}
					</text>
				</g>
			{:else}
				<text x={labelW} y={y + 4} fill="#4a4e3a" font-size="11">campo assente — cella fantasma</text>
			{/if}
		{/each}
		<text x={labelW} y={H - 4} fill="#b49a6c" font-size="10">{formatNum(global.lo)} ▸ {formatNum(global.hi)} (baffi)</text>
	</svg>
</figure>

<style>
	.fig {
		margin: 0;
		display: block;
		width: 100%;
		max-width: 100%;
		overflow-x: auto;
	}
	svg {
		width: 100%;
		min-width: 640px;
		height: auto;
		display: block;
		background: var(--paper);
		color: var(--ink);
	}
</style>
