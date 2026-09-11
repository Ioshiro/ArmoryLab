<script lang="ts">
	import type { Weapon } from '$lib/types';
	import { skillLabel, formatNum } from '$lib/labels';
	import { BANDS, laddersBySkill, SHAMBLER_HP, sourceOf, type Ranked } from '$lib/progression';
	import { combatLabHref, inCombatLab } from '$lib/combatlab';

	let {
		weapons,
		roster = $bindable([]),
		onPin
	}: {
		weapons: Weapon[];
		roster: string[];
		onPin: (id: string) => void;
	} = $props();

	const rows = $derived(laddersBySkill(weapons));
	const rosterSet = $derived(new Set(roster));

	function toggleRoster(id: string) {
		if (roster.includes(id)) roster = roster.filter((x) => x !== id);
		else roster = [...roster, id];
	}

	function cellTitle(r: Ranked) {
		const src = sourceOf(r.weapon);
		const cl = inCombatLab(r.weapon.id) ? ' · in Combat Lab' : ' · non in Combat Lab';
		return `${r.weapon.displayName} · dmg ${formatNum(r.value)} · HTK ${formatNum(SHAMBLER_HP / r.value)} · ${src}${cl}`;
	}
</script>

<section class="ladder">
	<h2>Candidati T1–T6 per skill</h2>
	<p class="muted">
		Sestili sul danno atteso script (skill 0, no perk). Combat Lab valida HTK sulle build A+F.
		CL = già nel catalogo. Clic = roster.
	</p>
	<div class="wrap">
		<table class="data">
			<thead>
				<tr>
					<th>Skill</th>
					{#each BANDS as b}
						<th>T{b}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<th scope="row">{skillLabel(row.skill)} <span class="n">{row.ranked.length}</span></th>
						{#each BANDS as b}
							<td>
								<div class="cell">
									{#each row.bands[b] as r}
										<button
											type="button"
											class="wid"
											class:cl={inCombatLab(r.weapon.id)}
											class:on={rosterSet.has(r.weapon.id)}
											title={cellTitle(r)}
											onclick={() => toggleRoster(r.weapon.id)}
										>
											{r.weapon.id}
										</button>
									{/each}
									{#if row.bands[b].length === 0}
										<span class="ghost-cell">—</span>
									{/if}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if roster.length}
		<div class="roster">
			<span class="muted">Roster {roster.length}</span>
			{#each roster as id}
				<span class="chip">
					<button type="button" class="link" onclick={() => onPin(id)}>{id}</button>
					{#if inCombatLab(id)}
						<a href={combatLabHref(id, true)} target="_blank" rel="noreferrer">CL</a>
					{:else}
						<span class="ghost-cell" title="Assente dal catalogo Combat Lab">no CL</span>
					{/if}
					<button type="button" class="x" aria-label="Togli {id}" onclick={() => toggleRoster(id)}>×</button>
				</span>
			{/each}
		</div>
	{/if}
</section>

<style>
	.ladder h2 { margin-bottom: 0.25rem; }
	.wrap { overflow: auto; }
	.ladder :global(table.data) { min-width: 960px; }
	.ladder :global(th),
	.ladder :global(td) { vertical-align: top; white-space: normal; }
	.n { color: var(--ink-dim); font-weight: 400; }
	.cell { display: flex; flex-wrap: wrap; gap: 3px 6px; max-width: 14rem; }
	.wid {
		border: 0;
		padding: 0;
		font-size: 11px;
		color: var(--ink);
		text-align: left;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.wid.cl { color: var(--amber); }
	.wid.on {
		background: var(--amber);
		color: var(--ground);
		text-decoration: none;
		padding: 0 0.2rem;
	}
	.roster {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 10px;
		align-items: center;
		margin-top: 0.75rem;
		padding-top: 0.6rem;
		border-top: 1px solid var(--line);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--line);
		padding: 0.12rem 0.35rem;
		font-size: 11px;
	}
	.link { border: 0; padding: 0; color: var(--ink); }
	.link:hover { color: var(--amber); }
	.x { border: 0; padding: 0; color: var(--ink-dim); }
</style>
