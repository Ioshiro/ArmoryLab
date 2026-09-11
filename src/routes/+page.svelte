<script lang="ts">
	import { WEAPONS, COUNT, GENERATED_AT, DATA } from '$lib/data';
	import type { Cue, MetricKey, Weapon } from '$lib/types';
	import {
		CUE_IT,
		DISPLAY_IT,
		FAMILY_IT,
		METRIC_IT,
		SKILL_ORDER,
		formatNum,
		metricValue,
		skillLabel
	} from '$lib/labels';
	import { boxplot, groupBySkill, matchesCue, topAlerts } from '$lib/stats';
	import Boxplots from '$lib/components/Boxplots.svelte';
	import Scatter from '$lib/components/Scatter.svelte';
	import DualChannel from '$lib/components/DualChannel.svelte';

	let cue = $state<Cue>('all');
	let metric = $state<MetricKey>('expectedStanding');
	let q = $state('');
	let sortKey = $state<string>('expectedStanding');
	let sortDir = $state<1 | -1>(-1);
	let pinned = $state<string[]>([]);
	let left = $state<string | null>('base:axe');
	let right = $state<string | null>('base:longblade');
	let hideImprovised = $state(false);
	let onlyCrafted = $state(false);

	const filtered = $derived.by(() => {
		const query = q.trim().toLowerCase();
		return WEAPONS.filter((w) => {
			if (!matchesCue(w, cue)) return false;
			if (hideImprovised && w.improvised && w.categories.length <= 1) return false;
			if (onlyCrafted && w.displayCategory !== 'WeaponCrafted') return false;
			if (!query) return true;
			return (
				w.id.toLowerCase().includes(query) ||
				w.displayName.toLowerCase().includes(query) ||
				w.fullType.toLowerCase().includes(query) ||
				w.displayCategory.toLowerCase().includes(query)
			);
		});
	});

	const counts = $derived.by(() => {
		const g = groupBySkill(filtered);
		return SKILL_ORDER.map((k) => ({ k, n: g.get(k)?.length ?? 0 })).filter((r) => r.n);
	});

	const familyCounts = $derived.by(() => {
		const m = new Map<string, number>();
		for (const w of filtered) m.set(w.family, (m.get(w.family) ?? 0) + 1);
		return [...m.entries()];
	});

	const alerts = $derived(topAlerts(filtered, metric, 6));
	const globalBox = $derived(boxplot(filtered, metric));

	const sorted = $derived.by(() => {
		const rows = [...filtered];
		rows.sort((a, b) => {
			const va = cell(a, sortKey);
			const vb = cell(b, sortKey);
			if (va == null && vb == null) return 0;
			if (va == null) return 1;
			if (vb == null) return -1;
			if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir;
			return String(va).localeCompare(String(vb)) * sortDir;
		});
		return rows;
	});

	const pinWeapons = $derived(pinned.map((id) => WEAPONS.find((w) => w.id === id)).filter(Boolean) as Weapon[]);

	const stamp = $derived(
		new Date(GENERATED_AT).toISOString().replace('T', ' ').slice(0, 19) + 'Z'
	);

	function cell(w: Weapon, key: string): number | string | null {
		if (key === 'id') return w.id;
		if (key === 'name') return w.displayName;
		if (key === 'skill') return w.skillKey;
		if (key === 'family') return w.family;
		if (key === 'cat') return w.displayCategory;
		return metricValue(w, key as MetricKey);
	}

	function sortBy(key: string) {
		if (sortKey === key) sortDir = sortDir === 1 ? -1 : 1;
		else {
			sortKey = key;
			sortDir = key === 'id' || key === 'name' ? 1 : -1;
		}
	}

	function togglePin(id: string) {
		if (pinned.includes(id)) pinned = pinned.filter((x) => x !== id);
		else if (pinned.length < 2) pinned = [...pinned, id];
		else pinned = [pinned[1], id];
	}

	const compareMetrics: MetricKey[] = [
		'expectedStanding',
		'avgDamage',
		'weight',
		'baseSpeed',
		'maxRange',
		'critChance',
		'expectedHitsToBreak',
		'enduranceSwingStrength5',
		'door',
		'maxHit'
	];

	const tableCols: { key: string; label: string; num?: boolean }[] = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Nome EN' },
		{ key: 'skill', label: 'Skill' },
		{ key: 'expectedStanding', label: 'Dmg atteso', num: true },
		{ key: 'avgDamage', label: 'Dmg medio', num: true },
		{ key: 'weight', label: 'Peso', num: true },
		{ key: 'baseSpeed', label: 'Speed', num: true },
		{ key: 'maxRange', label: 'Range', num: true },
		{ key: 'critChance', label: 'Crit%', num: true },
		{ key: 'expectedHitsToBreak', label: 'Durata', num: true },
		{ key: 'maxHit', label: 'Hit', num: true },
		{ key: 'door', label: 'Porta', num: true },
		{ key: 'soundRadius', label: 'Suono', num: true }
	];

	function duelDelta(a: Weapon, b: Weapon, key: MetricKey) {
		const va = metricValue(a, key);
		const vb = metricValue(b, key);
		if (va == null || vb == null) return null;
		return va - vb;
	}
</script>

<div class="terminal">
	<header class="mast">
		<div class="mast-l">
			<h1>Knox AEBS — sector weapon.census · {COUNT} item base:weapon</h1>
			<p class="muted">
				Fonte {DATA.source.script}. Stime etichettate, non DPS in-game. Estratto {stamp}. Cue
				famiglia + pattern, non solo colore.
			</p>
		</div>
		<div class="mast-r" aria-label="Cue famiglia">
			{#each Object.entries(CUE_IT) as [id, label]}
				<button
					type="button"
					class="cue-btn cue-{id}"
					data-cue={id}
					aria-pressed={cue === id}
					onclick={() => (cue = id as Cue)}
				>
					<i class="cue-pat" aria-hidden="true"></i>
					{label}
				</button>
			{/each}
		</div>
	</header>

	<nav class="cues" aria-label="Metrica del bollettino">
		<span class="muted">METRICA</span>
		{#each Object.entries(METRIC_IT) as [id, meta]}
			<button type="button" aria-pressed={metric === id} onclick={() => (metric = id as MetricKey)}>
				{meta.short}
			</button>
		{/each}
	</nav>

	<section class="grid-hero">
		<article class="sheet census">
			<h2>Printout — {CUE_IT[cue]} · n={filtered.length}</h2>
			<p class="muted">{METRIC_IT[metric].cite}</p>
			<div class="tally">
				{#each counts as row}
					<div>
						<span class="amber">{skillLabel(row.k)}</span>
						<span>{row.n}</span>
					</div>
				{/each}
			</div>
			<div class="tally fam">
				{#each familyCounts as [fam, n]}
					<div>
						<span class="muted">{FAMILY_IT[fam] ?? fam}</span>
						<span>{n}</span>
					</div>
				{/each}
			</div>
			{#if globalBox}
				<p>
					Globale {METRIC_IT[metric].short}: med {formatNum(globalBox.median)} · IQR
					{formatNum(globalBox.q1)}–{formatNum(globalBox.q3)} · media {formatNum(globalBox.mean)}
				</p>
			{/if}
			<div class="alerts">
				{#each alerts as a, i}
					<div class="alert-row">
						<span class="alarm">ALERT {String(i + 1).padStart(2, '0')}</span>
						<button type="button" class="link" onclick={() => togglePin(a.weapon.id)}>
							{a.weapon.id}
						</button>
						<span>{a.weapon.displayName}</span>
						<span class="amber">{skillLabel(a.weapon.skillKey)}</span>
						<span>{formatNum(a.value)} · z {formatNum(a.z)}</span>
					</div>
				{/each}
				{#if alerts.length === 0}
					<p class="ghost-cell">Nessun ALERT su questo cue — cella vuota, non omessa.</p>
				{/if}
			</div>
		</article>
		<article class="sheet">
			<Boxplots weapons={filtered} {metric} />
		</article>
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet split" class:open={left && right}>
		<DualChannel weapons={filtered} bind:left bind:right metrics={compareMetrics} />
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet">
		<Scatter weapons={filtered} xKey="weight" yKey={metric} highlight={pinned} />
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet duel">
		<h2>Testa a testa — due armi pinnate</h2>
		<p class="muted">Pinna dal registro o dagli ALERT (max 2). Selezione a stipple, non wash.</p>
		{#if pinWeapons.length < 2}
			<p class="ghost-cell">
				{pinWeapons.length === 1
					? `CANALE ARMA A: ${pinWeapons[0].id}. Pinna la seconda.`
					: 'Nessuna arma pinnata.'}
			</p>
		{:else}
			{@const a = pinWeapons[0]}
			{@const b = pinWeapons[1]}
			<table class="data">
				<thead>
					<tr>
						<th>Campo</th>
						<th>{a.id}</th>
						<th>{b.id}</th>
						<th>Δ A−B</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Nome</td>
						<td>{a.displayName}</td>
						<td>{b.displayName}</td>
						<td class="ghost-cell">—</td>
					</tr>
					<tr>
						<td>Skill</td>
						<td>{skillLabel(a.skillKey)}</td>
						<td>{skillLabel(b.skillKey)}</td>
						<td class="ghost-cell">—</td>
					</tr>
					{#each compareMetrics as key}
						{@const d = duelDelta(a, b, key)}
						<tr>
							<td>{METRIC_IT[key].short}</td>
							<td class="num">{formatNum(metricValue(a, key))}</td>
							<td class="num">{formatNum(metricValue(b, key))}</td>
							<td class="num" class:alarm={d != null && Math.abs(d) > 0}>{d == null ? '—' : formatNum(d)}</td>
						</tr>
					{/each}
					<tr>
						<td>2H / ranged</td>
						<td>{a.twoHand ? '2H' : '1H'} / {a.ranged ? 'sì' : 'no'}</td>
						<td>{b.twoHand ? '2H' : '1H'} / {b.ranged ? 'sì' : 'no'}</td>
						<td class="ghost-cell">—</td>
					</tr>
					<tr>
						<td>SoundRadius</td>
						<td class="num">{a.soundRadius == null ? '—' : a.soundRadius}</td>
						<td class="num">{b.soundRadius == null ? '—' : b.soundRadius}</td>
						<td class="ghost-cell">{a.soundRadius == null && b.soundRadius == null ? 'campo assente' : ''}</td>
					</tr>
				</tbody>
			</table>
		{/if}
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet">
		<h2>Registro completo</h2>
		<p class="muted">
			Ordina da tastiera: Invio o Spazio sull’header. Pinna per il testa a testa.
			DisplayCategory vanilla tenuta, junk incluso.
		</p>
		<div class="tools">
			<label>
				Cerca
				<input type="search" bind:value={q} placeholder="ID, nome, categoria…" aria-label="Cerca armi" />
			</label>
			<label>
				<input type="checkbox" bind:checked={hideImprovised} />
				Nascondi solo-improvvisate
			</label>
			<label>
				<input type="checkbox" bind:checked={onlyCrafted} />
				Solo WeaponCrafted
			</label>
			<span class="muted">{sorted.length} righe</span>
		</div>
		<div class="table-wrap">
			<table class="data">
				<thead>
					<tr>
						<th>Pin</th>
						{#each tableCols as col}
							<th
								aria-sort={sortKey === col.key
									? sortDir === 1
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<button type="button" class="sort" onclick={() => sortBy(col.key)}>
									{col.label}
									{#if sortKey === col.key}
										<i class="caret" class:up={sortDir === 1} aria-hidden="true"></i>
									{/if}
								</button>
							</th>
						{/each}
						<th>DisplayCat</th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as w (w.id)}
						<tr class:pinned={pinned.includes(w.id)}>
							<td>
								<button
									type="button"
									aria-pressed={pinned.includes(w.id)}
									onclick={() => togglePin(w.id)}
									aria-label="Pinna {w.id}"
								>
									{pinned.includes(w.id) ? 'PIN' : '·'}
								</button>
							</td>
							<td>{w.id}</td>
							<td>{w.displayName}</td>
							<td>{skillLabel(w.skillKey)}</td>
							<td class="num">{formatNum(w.derived.expectedStanding)}</td>
							<td class="num">{formatNum(w.avgDamage)}</td>
							<td class="num">{formatNum(w.weight)}</td>
							<td class="num">{formatNum(w.baseSpeed)}</td>
							<td class="num">{formatNum(w.maxRange)}</td>
							<td class="num">{formatNum(w.critChance)}</td>
							<td class="num">{formatNum(w.derived.expectedHitsToBreak, 0)}</td>
							<td class="num">{w.maxHit}</td>
							<td class="num">{w.door}</td>
							<td class="num">{w.soundRadius == null ? '—' : w.soundRadius}</td>
							<td>{DISPLAY_IT[w.displayCategory] ?? w.displayCategory}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<footer class="sheet foot">
		<p>
			Default script: MaxDamage 1.5, BaseSpeed 1.0, CriticalChance 20, CritDmg 2.0, EnduranceMod 1.0,
			ConditionLowerChanceOneIn 10. Combat speed skill 0 = clamp(0.8 × BaseSpeed, 0.8, 1.6), rand
			1.1–1.2 non incluso. Crit a terra (aimAtFloor) usa max(5, CritDmg) — colonna non mostrata come
			DPS. Non è un client di gioco.
		</p>
	</footer>
</div>

<style>
	.terminal {
		max-width: 1280px;
		margin: 0 auto;
		padding: 1.25rem 1rem 4rem;
	}
	.mast {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1.5rem;
		align-items: start;
		margin-bottom: 1rem;
	}
	.mast-r,
	.cues {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.cues {
		margin: 0 0 1.25rem;
	}
	.grid-hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 1.25rem;
	}
	.tally {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 0.25rem 1rem;
		margin: 0.6rem 0 1rem;
		font-size: 13px;
	}
	.tally div {
		display: flex;
		justify-content: space-between;
		border-bottom: 1px dotted var(--line);
		padding: 0.1rem 0;
	}
	.alert-row {
		display: grid;
		grid-template-columns: 6.2rem minmax(7rem, 12rem) minmax(8rem, 1fr) auto auto;
		gap: 0.5rem;
		align-items: baseline;
		padding: 0.28rem 0;
		border-bottom: 1px solid var(--line);
		font-size: 13px;
	}
	.alert-row .link {
		border: 0;
		padding: 0;
		color: var(--ink);
		text-align: left;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.alert-row .link:hover {
		color: var(--amber);
	}
	.split {
		position: relative;
		overflow: hidden;
	}
	.split::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		width: 2px;
		height: 100%;
		background: repeating-linear-gradient(
			180deg,
			var(--amber) 0 4px,
			transparent 4px 8px
		);
		transform: scaleY(0);
		transform-origin: top;
		transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: none;
	}
	.split.open::after {
		transform: scaleY(1);
	}
	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: end;
		margin: 0.75rem 0;
	}
	.tools label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 11px;
		text-transform: uppercase;
	}
	.tools label:has([type='checkbox']) {
		flex-direction: row;
		align-items: center;
		text-transform: none;
		font-size: 13px;
	}
	.table-wrap {
		max-height: 28rem;
		overflow: auto;
		border: 1px solid var(--line);
	}
	.foot {
		margin-top: 2rem;
		color: var(--ink-dim);
		font-size: 12px;
	}
	@media (max-width: 960px) {
		.mast,
		.grid-hero,
		.split.open {
			grid-template-columns: minmax(0, 1fr);
			background: var(--paper);
		}
		.split::after {
			display: none;
		}
		.alert-row {
			grid-template-columns: 1fr 1fr;
		}
	}
	.cue-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.cue-pat {
		display: block;
		width: 0.7rem;
		height: 0.7rem;
		flex-shrink: 0;
		border: 1px solid currentColor;
	}
	.cue-all .cue-pat {
		background: currentColor;
	}
	.cue-melee .cue-pat {
		background: repeating-linear-gradient(
			45deg,
			currentColor,
			currentColor 1px,
			transparent 1px,
			transparent 4px
		);
	}
	.cue-firearm .cue-pat {
		background-image: radial-gradient(currentColor 1px, transparent 1.25px);
		background-size: 4px 4px;
	}
	.cue-explosive .cue-pat {
		background: repeating-linear-gradient(
			-45deg,
			currentColor,
			currentColor 1px,
			transparent 1px,
			transparent 3px
		);
	}
	.cue-debug .cue-pat {
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			currentColor 2px,
			currentColor 3px
		);
	}
	.sort {
		border: 0;
		padding: 0;
		background: transparent;
		color: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
		font: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.caret {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-right: 1px solid currentColor;
		border-bottom: 1px solid currentColor;
		transform: rotate(45deg);
		flex-shrink: 0;
	}
	.caret.up {
		transform: rotate(-135deg);
	}
</style>
