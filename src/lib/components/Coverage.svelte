<script lang="ts">
	import type { Weapon } from '$lib/types';
	import { SKILL_ORDER, skillLabel, formatNum } from '$lib/labels';
	import { groupBySkill } from '$lib/stats';
	import { rankByPower, SHAMBLER_HP } from '$lib/progression';
	import { COMBAT_IDS, combatLabHref, inCombatLab, SKILL_TO_COMBAT } from '$lib/combatlab';

	let { weapons }: { weapons: Weapon[] } = $props();

	const rows = $derived.by(() => {
		const g = groupBySkill(weapons);
		return SKILL_ORDER.filter((k) => SKILL_TO_COMBAT[k] && (g.get(k)?.length ?? 0) > 0).map((skill) => {
			const list = g.get(skill) ?? [];
			const ranked = rankByPower(list);
			const inLab = list.filter((w) => inCombatLab(w.id));
			const missing = [...ranked].reverse().filter((r) => !inCombatLab(r.weapon.id)).slice(0, 3);
			const top = ranked[ranked.length - 1];
			const bot = ranked[0];
			return { skill, n: list.length, nLab: inLab.length, top, bot, missing, reps: inLab };
		});
	});
</script>

<section>
	<h2>Copertura Combat Lab</h2>
	<p class="muted">
		33 armi simulate. I gap sono i più forti dello script non ancora nel catalogo — da mandare a Combat Lab prima di chiudere un tier.
	</p>
	<div class="wrap">
		<table class="data">
			<thead>
				<tr>
					<th>Skill</th>
					<th class="num">n</th>
					<th class="num">CL</th>
					<th>Rappresentanti</th>
					<th>Base (T1 cand.)</th>
					<th>Tetto (T6 cand.)</th>
					<th>Gap da simulare</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r}
					<tr>
						<td>{skillLabel(r.skill)}</td>
						<td class="num">{r.n}</td>
						<td class="num">{r.nLab}</td>
						<td>
							{#each r.reps as w, i}{i ? ' · ' : ''}<a href={combatLabHref(w.id)} target="_blank" rel="noreferrer">{w.id}</a>{/each}
							{#if r.reps.length === 0}<span class="ghost-cell">nessuno</span>{/if}
						</td>
						<td>
							{#if r.bot}
								{r.bot.weapon.id}
								<span class="muted">{formatNum(r.bot.value)} · HTK {formatNum(SHAMBLER_HP / r.bot.value)}</span>
							{/if}
						</td>
						<td>
							{#if r.top}
								{r.top.weapon.id}
								<span class="muted">{formatNum(r.top.value)} · HTK {formatNum(SHAMBLER_HP / r.top.value)}</span>
							{/if}
						</td>
						<td>
							{#each r.missing as m, i}{i ? ' · ' : ''}{m.weapon.id}{/each}
							{#if r.missing.length === 0}<span class="muted">catalogo copre il tetto</span>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="muted">Catalogo Combat Lab: {COMBAT_IDS.size} ID. HTK qui = 1.95 / danno atteso, non il motore perk+tier.</p>
</section>

<style>
	.wrap { overflow: auto; }
	a { font-size: 12px; }
</style>
