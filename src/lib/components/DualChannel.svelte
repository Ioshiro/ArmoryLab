<script lang="ts">
	import type { MetricKey, Weapon } from '$lib/types';
	import { SKILL_ORDER, METRIC_IT, formatNum, skillLabel, metricValue } from '$lib/labels';
	import { boxplot } from '$lib/stats';

	let {
		weapons,
		left = $bindable(null),
		right = $bindable(null),
		metrics
	}: {
		weapons: Weapon[];
		left: string | null;
		right: string | null;
		metrics: MetricKey[];
	} = $props();

	function pack(key: string | null) {
		if (!key) return null;
		const list = weapons.filter((w) => w.skillKey === key);
		return { key, list, n: list.length };
	}

	const A = $derived(pack(left));
	const B = $derived(pack(right));

	function row(metric: MetricKey) {
		const ba = A ? boxplot(A.list, metric) : null;
		const bb = B ? boxplot(B.list, metric) : null;
		const vals = [ba?.median, bb?.median, ba?.q1, ba?.q3, bb?.q1, bb?.q3].filter(
			(v): v is number => v != null
		);
		const lo = vals.length ? Math.min(...vals) : 0;
		const hi = vals.length ? Math.max(...vals) : 1;
		return { metric, ba, bb, lo, hi: hi === lo ? hi + 1 : hi };
	}

	const rows = $derived(metrics.map(row));

	function bar(v: number | undefined, lo: number, hi: number) {
		if (v == null) return 0;
		return ((v - lo) / (hi - lo)) * 100;
	}

	function tops(list: Weapon[] | undefined, metric: MetricKey) {
		if (!list) return [];
		return [...list]
			.map((w) => ({ w, v: metricValue(w, metric) }))
			.filter((p) => p.v != null)
			.sort((a, b) => (b.v as number) - (a.v as number))
			.slice(0, 3);
	}
</script>

<section class="dual">
	<h2>Canali A / B — confronto categorie</h2>
	<p class="muted">
		Stessa griglia, stesse metriche. Allineamento, non colore. Seleziona due skill; il foglio si
		divide.
	</p>
	<div class="pick">
		<label>
			Canale A
			<select aria-label="Skill canale A" bind:value={left}>
				<option value="">—</option>
				{#each SKILL_ORDER as k}
					<option value={k}>{skillLabel(k)}</option>
				{/each}
			</select>
		</label>
		<label>
			Canale B
			<select aria-label="Skill canale B" bind:value={right}>
				<option value="">—</option>
				{#each SKILL_ORDER as k}
					<option value={k}>{skillLabel(k)}</option>
				{/each}
			</select>
		</label>
	</div>
	{#if !A && !B}
		<p class="ghost-cell">Nessun canale sintonizzato. Scegli due skill dai menu.</p>
	{:else}
		<div class="head">
			<div class="ch">
				<strong>CANALE A</strong>
				<div>{A ? `${skillLabel(A.key)} · n=${A.n}` : '— silenzio —'}</div>
			</div>
			<div class="ch">
				<strong>CANALE B</strong>
				<div>{B ? `${skillLabel(B.key)} · n=${B.n}` : '— silenzio —'}</div>
			</div>
		</div>
		{#each rows as r}
			<div class="metric">
				<div class="mlabel">{METRIC_IT[r.metric].short}</div>
				<div class="bars">
					<div class="side">
						{#if r.ba}
							<div class="track" title="A {formatNum(r.ba.median)}">
								<span
									class="iqr"
									style="left:{bar(r.ba.q1, r.lo, r.hi)}%; width:{Math.max(0, bar(r.ba.q3, r.lo, r.hi) - bar(r.ba.q1, r.lo, r.hi))}%"
								></span>
								<span class="med" style="left:{bar(r.ba.median, r.lo, r.hi)}%"></span>
							</div>
							<div class="v">{formatNum(r.ba.median)}</div>
						{:else}
							<div class="ghost-cell">campo assente</div>
						{/if}
					</div>
					<div class="side">
						{#if r.bb}
							<div class="track" title="B {formatNum(r.bb.median)}">
								<span
									class="iqr b"
									style="left:{bar(r.bb.q1, r.lo, r.hi)}%; width:{Math.max(0, bar(r.bb.q3, r.lo, r.hi) - bar(r.bb.q1, r.lo, r.hi))}%"
								></span>
								<span class="med b" style="left:{bar(r.bb.median, r.lo, r.hi)}%"></span>
							</div>
							<div class="v">{formatNum(r.bb.median)}</div>
						{:else}
							<div class="ghost-cell">campo assente</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
		<div class="tops">
			<div>
				<div class="muted">Top 3 canale A ({METRIC_IT[metrics[0]].short})</div>
				{#each tops(A?.list, metrics[0]) as t}
					<div>{t.w.id} · {formatNum(t.v)}</div>
				{/each}
				{#if !A}<div class="ghost-cell">—</div>{/if}
			</div>
			<div>
				<div class="muted">Top 3 canale B ({METRIC_IT[metrics[0]].short})</div>
				{#each tops(B?.list, metrics[0]) as t}
					<div>{t.w.id} · {formatNum(t.v)}</div>
				{/each}
				{#if !B}<div class="ghost-cell">—</div>{/if}
			</div>
		</div>
	{/if}
</section>

<style>
	.dual h2 {
		margin-bottom: 0.35rem;
	}
	.head,
	.tops,
	.bars,
	.pick {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	.ch strong {
		color: var(--amber);
	}
	.metric {
		margin: 0.55rem 0;
	}
	.mlabel {
		text-transform: uppercase;
		font-size: 11px;
		margin-bottom: 0.2rem;
	}
	.side {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
		align-items: center;
	}
	.track {
		position: relative;
		height: 14px;
		background: var(--ground);
		border: 1px solid var(--line);
	}
	.iqr {
		position: absolute;
		top: 2px;
		bottom: 2px;
		background: repeating-linear-gradient(-45deg, var(--ink), var(--ink) 1px, transparent 1px, transparent 5px);
	}
	.iqr.b {
		background: repeating-linear-gradient(45deg, var(--sage), var(--sage) 1px, transparent 1px, transparent 5px);
	}
	.med {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--amber);
	}
	.med.b {
		background: var(--alarm);
	}
	.v {
		min-width: 3.5rem;
		text-align: right;
	}
	.pick {
		margin: 0.75rem 0 1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-transform: uppercase;
		font-size: 11px;
	}
	@media (max-width: 720px) {
		.head,
		.tops,
		.bars,
		.pick {
			grid-template-columns: 1fr;
			gap: 0.6rem;
		}
	}
</style>
