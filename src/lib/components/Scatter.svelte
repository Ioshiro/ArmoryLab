<script lang="ts">
	import type { MetricKey, Weapon } from '$lib/types';
	import { formatNum, skillLabel, METRIC_IT } from '$lib/labels';
	import { metricValue } from '$lib/labels';
	import { extent } from '$lib/stats';

	let {
		weapons,
		xKey = 'weight',
		yKey = 'expectedStanding',
		highlight = []
	}: {
		weapons: Weapon[];
		xKey?: MetricKey;
		yKey?: MetricKey;
		highlight?: string[];
	} = $props();

	const points = $derived.by(() => {
		const pts = [];
		for (const w of weapons) {
			const x = metricValue(w, xKey);
			const y = metricValue(w, yKey);
			if (x == null || y == null) continue;
			pts.push({ w, x, y });
		}
		return pts;
	});

	const xExt = $derived(extent(points.map((p) => p.x)));
	const yExt = $derived(extent(points.map((p) => p.y)));

	const W = 720;
	const H = 380;
	const L = 46;
	const R = 16;
	const T = 12;
	const B = 36;

	function sx(v: number) {
		return L + ((v - xExt[0]) / (xExt[1] - xExt[0])) * (W - L - R);
	}
	function sy(v: number) {
		return T + (1 - (v - yExt[0]) / (yExt[1] - yExt[0])) * (H - T - B);
	}

	function mark(family: string) {
		if (family === 'firearm') return 'sq';
		if (family === 'explosive' || family === 'thrown') return 'tri';
		if (family === 'debug') return 'x';
		return 'c';
	}

	const hi = $derived(new Set(highlight));
</script>

<figure class="fig">
	<h2>Fig. 2 — {METRIC_IT[yKey].short} × {METRIC_IT[xKey].short}</h2>
	<p class="muted">
		Cerchio mischia · quadrato da fuoco · triangolo esplosivo. Colore non è l’unico encoding.
		Puntini allarme = armi pinnate.
	</p>
	<svg viewBox="0 0 {W} {H}" role="img" aria-label="Scatter {METRIC_IT[yKey].short} contro {METRIC_IT[xKey].short}">
		<line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line)" />
		<line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line)" />
		<text x={(L + W - R) / 2} y={H - 8} fill="var(--ink-dim)" font-size="11" text-anchor="middle">
			{METRIC_IT[xKey].short}
		</text>
		<text
			x="14"
			y={(T + H - B) / 2}
			fill="var(--ink-dim)"
			font-size="11"
			text-anchor="middle"
			transform="rotate(-90 14 {(T + H - B) / 2})"
		>
			{METRIC_IT[yKey].short}
		</text>
		{#each points as p}
			{@const X = sx(p.x)}
			{@const Y = sy(p.y)}
			{@const pinned = hi.has(p.w.id)}
			{@const m = mark(p.w.family)}
			<g class:pinned>
				{#if m === 'sq'}
					<rect x={X - 3} y={Y - 3} width="6" height="6" fill={pinned ? 'var(--alarm)' : 'var(--amber)'} />
				{:else if m === 'tri'}
					<polygon points={`${X},${Y - 4} ${X + 4},${Y + 3} ${X - 4},${Y + 3}`} fill={pinned ? 'var(--alarm)' : 'var(--sage)'} />
				{:else if m === 'x'}
					<line x1={X - 4} y1={Y - 4} x2={X + 4} y2={Y + 4} stroke="var(--ghost)" />
					<line x1={X + 4} y1={Y - 4} x2={X - 4} y2={Y + 4} stroke="var(--ghost)" />
				{:else}
					<circle cx={X} cy={Y} r={pinned ? 4.5 : 3} fill={pinned ? 'var(--alarm)' : 'var(--ink)'} fill-opacity="0.75" />
				{/if}
				<title>{p.w.displayName} ({p.w.id}) · {skillLabel(p.w.skillKey)} · x {formatNum(p.x)} y {formatNum(p.y)}</title>
			</g>
		{/each}
		<text x={L} y={H - B + 14} fill="var(--ink-dim)" font-size="10">{formatNum(xExt[0])}</text>
		<text x={W - R} y={H - B + 14} fill="var(--ink-dim)" font-size="10" text-anchor="end">{formatNum(xExt[1])}</text>
		<text x={L - 6} y={H - B} fill="var(--ink-dim)" font-size="10" text-anchor="end">{formatNum(yExt[0])}</text>
		<text x={L - 6} y={T + 4} fill="var(--ink-dim)" font-size="10" text-anchor="end">{formatNum(yExt[1])}</text>
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
		min-width: 720px;
		height: auto;
		display: block;
		background: var(--paper);
	}
</style>
