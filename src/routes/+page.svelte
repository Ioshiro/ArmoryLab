<script lang="ts">
	import { onMount } from 'svelte';
	import { WEAPONS, COUNT, GENERATED_AT, DATA } from '$lib/data';
	import type { Cue, MetricKey, Weapon } from '$lib/types';
	import {
		CUE_IT,
		CUE_ORDER,
		CUE_PAT,
		DISPLAY_IT,
		METRIC_IT,
		SKILL_ORDER,
		formatNum,
		metricValue,
		skillLabel
	} from '$lib/labels';
	import { boxplot, groupBySkill, matchesCue, topAlerts } from '$lib/stats';
	import {
		SOURCE_IT,
		htkScript,
		laddersBySkill,
		matchesSource,
		sourceOf,
		type Ranked,
		type SourceCue
	} from '$lib/progression';
	import { combatLabHref, inCombatLab } from '$lib/combatlab';
	import Boxplots from '$lib/components/Boxplots.svelte';
	import Scatter from '$lib/components/Scatter.svelte';
	import DualChannel from '$lib/components/DualChannel.svelte';
	import ProgressionLadder from '$lib/components/ProgressionLadder.svelte';
	import Coverage from '$lib/components/Coverage.svelte';

	let cue = $state<Cue>('all');
	let metric = $state<MetricKey>('htkScript');
	let source = $state<SourceCue>('all');
	let q = $state('');
	let sortKey = $state<string>('htkScript');
	let sortDir = $state<1 | -1>(1);
	let pinned = $state<string[]>([]);
	let roster = $state<string[]>([]);
	let left = $state<string | null>('base:axe');
	let right = $state<string | null>('base:longblade');
	let scatterX = $state<MetricKey>('expectedHitsToBreak');

	const filtered = $derived.by(() => {
		const query = q.trim().toLowerCase();
		return WEAPONS.filter((w) => {
			if (!matchesCue(w, cue)) return false;
			if (!matchesSource(w, source)) return false;
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

	const alerts = $derived(topAlerts(filtered, metric, 5));
	const globalBox = $derived(boxplot(filtered, metric));

	const ranks = $derived.by(() => {
		const m = new Map<string, Ranked>();
		for (const row of laddersBySkill(filtered)) {
			for (const r of row.ranked) m.set(r.weapon.id, r);
		}
		return m;
	});

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

	const pinWeapons = $derived(
		pinned.map((id) => WEAPONS.find((w) => w.id === id)).filter(Boolean) as Weapon[]
	);

	const stamp = $derived(new Date(GENERATED_AT).toISOString().replace('T', ' ').slice(0, 16) + 'Z');

	function cell(w: Weapon, key: string): number | string | null {
		if (key === 'id') return w.id;
		if (key === 'name') return w.displayName;
		if (key === 'skill') return w.skillKey;
		if (key === 'family') return w.family;
		if (key === 'cat') return w.displayCategory;
		if (key === 'src') return sourceOf(w);
		if (key === 'band') return ranks.get(w.id)?.band ?? null;
		if (key === 'rank') return ranks.get(w.id)?.rank ?? null;
		if (key === 'cl') return inCombatLab(w.id) ? 1 : 0;
		return metricValue(w, key as MetricKey);
	}

	function sortBy(key: string) {
		if (sortKey === key) sortDir = sortDir === 1 ? -1 : 1;
		else {
			sortKey = key;
			sortDir = key === 'htkScript' || key === 'id' || key === 'name' || key === 'rank' ? 1 : -1;
		}
	}

	function togglePin(id: string) {
		if (pinned.includes(id)) pinned = pinned.filter((x) => x !== id);
		else if (pinned.length < 2) pinned = [...pinned, id];
		else pinned = [pinned[1], id];
	}

	const compareMetrics: MetricKey[] = [
		'htkScript',
		'expectedStanding',
		'avgDamage',
		'weight',
		'baseSpeed',
		'maxRange',
		'critChance',
		'expectedHitsToBreak',
		'enduranceSwingStrength5',
		'maxHit'
	];

	const tableCols: { key: string; label: string; num?: boolean }[] = [
		{ key: 'id', label: 'ID' },
		{ key: 'cl', label: 'CL', num: true },
		{ key: 'band', label: 'T', num: true },
		{ key: 'rank', label: 'Rk', num: true },
		{ key: 'skill', label: 'Skill' },
		{ key: 'src', label: 'Fonte' },
		{ key: 'htkScript', label: 'HTK', num: true },
		{ key: 'expectedStanding', label: 'Dmg atteso', num: true },
		{ key: 'weight', label: 'Peso', num: true },
		{ key: 'baseSpeed', label: 'Speed', num: true },
		{ key: 'maxRange', label: 'Range', num: true },
		{ key: 'critChance', label: 'Crit%', num: true },
		{ key: 'expectedHitsToBreak', label: 'Durata', num: true },
		{ key: 'maxHit', label: 'Hit', num: true }
	];

	function duelDelta(a: Weapon, b: Weapon, key: MetricKey) {
		const va = metricValue(a, key);
		const vb = metricValue(b, key);
		if (va == null || vb == null) return null;
		return va - vb;
	}

	function exportRoster() {
		const items = roster
			.map((id) => WEAPONS.find((w) => w.id === id))
			.filter(Boolean)
			.map((w) => {
				const r = ranks.get(w!.id);
				return {
					id: w!.id,
					displayName: w!.displayName,
					skillKey: w!.skillKey,
					source: sourceOf(w!),
					inCombatLab: inCombatLab(w!.id),
					combatLab: inCombatLab(w!.id) ? combatLabHref(w!.id, true) : null,
					expectedStanding: w!.derived.expectedStanding,
					htkScript: htkScript(w!),
					band: r?.band ?? null,
					rank: r?.rank ?? null
				};
			});
		const project = {
			schemaVersion: 1,
			kind: 'armory-roster',
			cue,
			source,
			metric,
			generatedAt: new Date().toISOString(),
			note: 'Bande e HTK sono base script (skill 0, shambler 1.95). Combat Lab applica perk, forza e tier TZonyne.',
			weapons: items
		};
		const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'pz-armory-roster.json';
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	onMount(() => {
		const params = new URLSearchParams(location.search);
		const c = params.get('cue');
		if (c && c in CUE_IT) cue = c as Cue;
		const s = params.get('source');
		if (s && s in SOURCE_IT) source = s as SourceCue;
		const pins = params.get('pin');
		if (pins) pinned = pins.split(',').filter(Boolean).slice(0, 2);
		const ros = params.get('roster');
		if (ros) roster = ros.split(',').filter(Boolean);
	});
</script>

<div class="terminal">
	<header class="mast">
		<div class="mast-l">
			<h1>Weapon.census</h1>
			<p class="muted">
				Knox AEBS · {COUNT} item · B42.20 · base script, non perk. Estratto {stamp}.
				<a href="https://ioshiro.github.io/CombatLab/">Combat.balance</a>
			</p>
		</div>
		<div class="mast-r" aria-label="Skill, come Combat Lab">
			{#each CUE_ORDER as id}
				<button
					type="button"
					class="cue-btn {CUE_PAT[id]}"
					aria-pressed={cue === id}
					onclick={() => (cue = id)}
				>
					<i class="cue-pat" aria-hidden="true"></i>
					{CUE_IT[id]}
				</button>
			{/each}
		</div>
	</header>

	<nav class="cues" aria-label="Metrica">
		<span class="muted">METRICA</span>
		{#each Object.entries(METRIC_IT) as [id, meta]}
			<button type="button" aria-pressed={metric === id} onclick={() => (metric = id as MetricKey)}>
				{meta.short}
			</button>
		{/each}
		<span class="sep" aria-hidden="true"></span>
		<span class="muted">FONTE</span>
		{#each Object.entries(SOURCE_IT) as [id, label]}
			<button type="button" aria-pressed={source === id} onclick={() => (source = id as SourceCue)}>
				{label}
			</button>
		{/each}
	</nav>

	<section class="grid-hero">
		<article class="sheet census">
			<h2>{CUE_IT[cue]} · {SOURCE_IT[source]} · n={filtered.length}</h2>
			<p class="muted">{METRIC_IT[metric].cite}</p>
			<div class="tally">
				{#each counts as row}
					<div>
						<span class="amber">{skillLabel(row.k)}</span>
						<span>{row.n}</span>
					</div>
				{/each}
			</div>
			{#if globalBox}
				<p>
					{METRIC_IT[metric].short}: med {formatNum(globalBox.median)} · IQR
					{formatNum(globalBox.q1)}–{formatNum(globalBox.q3)}
				</p>
			{/if}
			<div class="alerts">
				{#each alerts as a, i}
					<div class="alert-row">
						<span class="alarm">ALERT {String(i + 1).padStart(2, '0')}</span>
						<button type="button" class="link" onclick={() => togglePin(a.weapon.id)}>{a.weapon.id}</button>
						<span class="amber">{skillLabel(a.weapon.skillKey)}</span>
						<span>{formatNum(a.value)} · z {formatNum(a.z)}</span>
						{#if inCombatLab(a.weapon.id)}
							<a href={combatLabHref(a.weapon.id)} target="_blank" rel="noreferrer">CL</a>
						{:else}
							<span class="ghost-cell">no CL</span>
						{/if}
					</div>
				{/each}
				{#if alerts.length === 0}
					<p class="ghost-cell">Nessun ALERT su questo cue.</p>
				{/if}
			</div>
		</article>
		<article class="sheet">
			<Boxplots weapons={filtered} {metric} />
		</article>
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet">
		<ProgressionLadder weapons={filtered} bind:roster onPin={togglePin} />
		<div class="tools roster-tools">
			<button type="button" class="chip" disabled={!roster.length} onclick={exportRoster}>Esporta roster JSON</button>
			<span class="muted">Poi apri ogni CL in Combat Lab (RPG) e calibra i tier.</span>
		</div>
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet">
		<Coverage weapons={filtered} />
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet split" class:open={left && right}>
		<DualChannel weapons={filtered} bind:left bind:right metrics={compareMetrics} />
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet">
		<div class="tools">
			<span class="muted">Scatter X</span>
			{#each ['expectedHitsToBreak', 'weight', 'maxRange'] as x}
				<button type="button" aria-pressed={scatterX === x} onclick={() => (scatterX = x as MetricKey)}>
					{METRIC_IT[x as MetricKey].short}
				</button>
			{/each}
		</div>
		<Scatter weapons={filtered} xKey={scatterX} yKey={metric} highlight={pinned} />
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet duel">
		<h2>Testa a testa</h2>
		<p class="muted">Due pin dal registro o dagli ALERT. Δ = A−B.</p>
		{#if pinWeapons.length < 2}
			<p class="ghost-cell">
				{pinWeapons.length === 1 ? `A: ${pinWeapons[0].id}. Pinna la seconda.` : 'Nessuna arma pinnata.'}
			</p>
		{:else}
			{@const a = pinWeapons[0]}
			{@const b = pinWeapons[1]}
			<table class="data">
				<thead>
					<tr>
						<th>Campo</th>
						<th>
							{a.id}
							{#if inCombatLab(a.id)}<a href={combatLabHref(a.id, true)} target="_blank" rel="noreferrer">CL</a>{/if}
						</th>
						<th>
							{b.id}
							{#if inCombatLab(b.id)}<a href={combatLabHref(b.id, true)} target="_blank" rel="noreferrer">CL</a>{/if}
						</th>
						<th>Δ</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Nome / fonte</td>
						<td>{a.displayName} · {sourceOf(a)}</td>
						<td>{b.displayName} · {sourceOf(b)}</td>
						<td class="ghost-cell">—</td>
					</tr>
					<tr>
						<td>Skill / T-band</td>
						<td>{skillLabel(a.skillKey)} · T{ranks.get(a.id)?.band ?? '—'}</td>
						<td>{skillLabel(b.skillKey)} · T{ranks.get(b.id)?.band ?? '—'}</td>
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
				</tbody>
			</table>
		{/if}
	</section>

	<div class="cut" aria-hidden="true"></div>

	<section class="sheet">
		<h2>Registro</h2>
		<div class="tools">
			<label>
				Cerca
				<input type="search" bind:value={q} placeholder="ID, nome…" aria-label="Cerca armi" />
			</label>
			<span class="muted">{sorted.length} righe</span>
		</div>
		<div class="table-wrap">
			<table class="data">
				<thead>
					<tr>
						<th>Pin</th>
						{#each tableCols as col}
							<th aria-sort={sortKey === col.key ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'}>
								<button type="button" class="sort" onclick={() => sortBy(col.key)}>
									{col.label}
									{#if sortKey === col.key}
										<i class="caret" class:up={sortDir === 1} aria-hidden="true"></i>
									{/if}
								</button>
							</th>
						{/each}
						<th>Nome</th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as w (w.id)}
						{@const r = ranks.get(w.id)}
						<tr class:pinned={pinned.includes(w.id)}>
							<td>
								<button type="button" aria-pressed={pinned.includes(w.id)} onclick={() => togglePin(w.id)} aria-label="Pinna {w.id}">
									{pinned.includes(w.id) ? 'PIN' : '·'}
								</button>
							</td>
							<td>
								{#if inCombatLab(w.id)}
									<a href={combatLabHref(w.id)} target="_blank" rel="noreferrer">{w.id}</a>
								{:else}
									{w.id}
								{/if}
							</td>
							<td class="num">{inCombatLab(w.id) ? 'CL' : '—'}</td>
							<td class="num">{r ? `T${r.band}` : '—'}</td>
							<td class="num">{r?.rank ?? '—'}</td>
							<td>{skillLabel(w.skillKey)}</td>
							<td>{sourceOf(w)}</td>
							<td class="num">{formatNum(htkScript(w))}</td>
							<td class="num">{formatNum(w.derived.expectedStanding)}</td>
							<td class="num">{formatNum(w.weight)}</td>
							<td class="num">{formatNum(w.baseSpeed)}</td>
							<td class="num">{formatNum(w.maxRange)}</td>
							<td class="num">{formatNum(w.critChance)}</td>
							<td class="num">{formatNum(w.derived.expectedHitsToBreak, 0)}</td>
							<td class="num">{w.maxHit}</td>
							<td>{w.displayName}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<footer class="sheet foot">
		<p>
			HTK script = 1.95 HP / danno atteso in piedi (crit incluso, skill 0). Combat Lab applica Forza, perk arma e moltiplicatori T1–T6.
			Fonte {DATA.source.script}. Default HandWeapon: MaxDamage 1.5, Crit 20% ×2.
		</p>
	</footer>
</div>

<style>
	.terminal {
		max-width: none;
		width: 100%;
		margin: 0;
		padding: 0.85rem 1.35rem 2rem;
	}
	.mast {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1rem 1.5rem;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}
	.mast-r,
	.cues,
	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.cues { margin: 0 0 1rem; }
	.sep {
		width: 1px;
		height: 1.1rem;
		background: var(--line);
		margin: 0 0.4rem;
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
		grid-template-columns: 6.2rem minmax(7rem, 12rem) auto auto auto;
		gap: 0.5rem;
		align-items: baseline;
		padding: 0.28rem 0;
		border-bottom: 1px solid var(--line);
		font-size: 13px;
	}
	.alert-row .link,
	.sort {
		border: 0;
		padding: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	.alert-row .link {
		text-align: left;
		text-decoration: underline;
		text-underline-offset: 3px;
		color: var(--ink);
	}
	.alert-row .link:hover { color: var(--amber); }
	.split { position: relative; overflow: hidden; }
	.split::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		width: 2px;
		height: 100%;
		background: repeating-linear-gradient(180deg, var(--amber) 0 4px, transparent 4px 8px);
		transform: scaleY(0);
		transform-origin: top;
		transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: none;
	}
	.split.open::after { transform: scaleY(1); }
	.tools { margin: 0.5rem 0 0.75rem; }
	.tools label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 11px;
		text-transform: uppercase;
	}
	.roster-tools { gap: 0.75rem; }
	.table-wrap {
		max-height: min(62vh, 640px);
		overflow: auto;
		border: 1px solid var(--line);
	}
	.foot { margin-top: 1.5rem; color: var(--ink-dim); font-size: 12px; }
	@media (max-width: 960px) {
		.mast, .grid-hero, .split.open { grid-template-columns: minmax(0, 1fr); }
		.split::after { display: none; }
		.alert-row { grid-template-columns: 1fr 1fr; }
	}
	.cue-btn { display: inline-flex; align-items: center; gap: 0.4rem; }
	.cue-pat {
		display: block;
		width: 0.7rem;
		height: 0.7rem;
		flex-shrink: 0;
		border: 1px solid currentColor;
	}
	.cue-all .cue-pat { background: currentColor; }
	.cue-melee .cue-pat {
		background: repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 4px);
	}
	.cue-blade .cue-pat {
		background: repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px);
	}
	.cue-firearm .cue-pat {
		background-image: radial-gradient(currentColor 1px, transparent 1.25px);
		background-size: 4px 4px;
	}
	.cue-stomp .cue-pat {
		background: repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 3px);
	}
	.cue-explosive .cue-pat {
		background: repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 3px);
	}
	.cue-debug .cue-pat {
		background: repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px);
	}
	.sort {
		text-transform: inherit;
		letter-spacing: inherit;
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
	.caret.up { transform: rotate(-135deg); }
</style>
