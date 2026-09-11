#!/usr/bin/env node
/**
 * Estrae tutte le ItemType=base:weapon da weapon.txt vanilla.
 * Uso: bun run extract
 * Override: PZ_MEDIA, PZ_OUT
 */
import fs from "node:fs";
import path from "node:path";

const VANILLA = process.env.PZ_MEDIA ?? "E:/SteamLibrary/steamapps/common/ProjectZomboid/media";
const OUT = process.env.PZ_OUT ?? path.resolve(import.meta.dirname, "../src/lib/data/weapons.json");
const SCRIPT = path.join(VANILLA, "scripts/generated/items/weapon.txt");
const NAMES = path.join(VANILLA, "lua/shared/Translate/EN/ItemName.json");

const DEFAULTS = {
  Weight: 1, MinDamage: 0, MaxDamage: 1.5, BaseSpeed: 1, Swingtime: 1,
  MinimumSwingtime: 0, CriticalChance: 20, CritDmgMultiplier: 2, EnduranceMod: 1,
  KnockdownMod: 1, ConditionLowerChanceOneIn: 10, ConditionMax: 10, MaxHitcount: 1000,
  MaxRange: 1, MinRange: 0, MinAngle: 1, PushBackMod: 1, DoorDamage: 1, TreeDamage: 0,
  WeaponLength: 0.4, ToHitModifier: 1, JamGunChance: 1, Projectilecount: 1
};

const parseNum = (v) => {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/,$/, ""));
  return Number.isFinite(n) ? n : null;
};
const parseBool = (v) => {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return null;
};
const splitList = (v) => v ? String(v).split(";").map((s) => s.trim()).filter(Boolean) : [];
const numOrDefault = (fields, key) => {
  const n = parseNum(fields[key]);
  return n == null ? DEFAULTS[key] : n;
};
const primarySkill = (cats) => cats.filter((c) => c !== "base:improvised")[0] || cats[0] || null;

const names = JSON.parse(fs.readFileSync(NAMES, "utf8"));
const text = fs.readFileSync(SCRIPT, "utf8");
const items = [];
const re = /item\s+(\S+)\s*\{([\s\S]*?)\n    \}/g;
let m;
while ((m = re.exec(text))) {
  const id = m[1];
  const fields = {};
  for (const line of m[2].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("//")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    fields[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/,$/, "");
  }
  items.push({ id, fields });
}

function familyOf(w) {
  if (w.debug) return "debug";
  if (w.ranged || w.subCategory === "Firearm" || w.ammoType) return "firearm";
  if (w.displayCategory === "Explosives" || w.explosionPower != null || w.explosionRange != null) return "explosive";
  if (w.useSelf && w.physicsObject) return "thrown";
  if (w.primarySkill === "base:unarmed" || w.id === "BareHands") return "unarmed";
  return "melee";
}

const weapons = items.map((it) => {
  const f = it.fields;
  const categories = splitList(f.Categories);
  const weight = numOrDefault(f, "Weight");
  const minDamage = numOrDefault(f, "MinDamage");
  const maxDamage = numOrDefault(f, "MaxDamage");
  const baseSpeed = numOrDefault(f, "BaseSpeed");
  const critChance = numOrDefault(f, "CriticalChance");
  const critMult = numOrDefault(f, "CritDmgMultiplier");
  const enduranceMod = numOrDefault(f, "EnduranceMod");
  const condChance = numOrDefault(f, "ConditionLowerChanceOneIn");
  const condMax = numOrDefault(f, "ConditionMax");
  const twoHand = parseBool(f.TwoHandWeapon) === true;
  const ranged = parseBool(f.Ranged) === true || parseBool(f.IsAimedFirearm) === true;
  const debug = /DEBUG|DEV_ITEM/i.test(it.id) || f.DisplayCategory === "Hidden";
  const avgDamage = (minDamage + maxDamage) / 2;
  const pCrit = Math.max(0, Math.min(1, critChance / 100));
  const standingCritMult = Math.max(2, critMult);
  const floorMult = Math.max(5, critMult);
  const expectedStanding = avgDamage * (1 + pCrit * (standingCritMult - 1));
  const expectedFloor = avgDamage * floorMult * (1 + pCrit * (standingCritMult - 1));
  const combatSpeed = Math.min(1.6, Math.max(0.8, 0.8 * baseSpeed));
  const w = {
    id: it.id,
    fullType: "Base." + it.id,
    displayName: names["Base." + it.id] || it.id,
    displayCategory: f.DisplayCategory || "Weapon",
    categories,
    primarySkill: primarySkill(categories),
    improvised: categories.includes("base:improvised"),
    subCategory: f.SubCategory || null,
    tags: splitList(f.Tags),
    icon: f.Icon || (f.IconsForTexture ? f.IconsForTexture.split(";")[0] : null),
    weight, minDamage, maxDamage, avgDamage, baseSpeed,
    swingTime: numOrDefault(f, "Swingtime"),
    minSwing: numOrDefault(f, "MinimumSwingtime"),
    critChance, critMult, enduranceMod,
    knockdownMod: numOrDefault(f, "KnockdownMod"),
    condChance, condMax,
    maxHit: numOrDefault(f, "MaxHitcount"),
    maxRange: numOrDefault(f, "MaxRange"),
    minRange: numOrDefault(f, "MinRange"),
    minAngle: numOrDefault(f, "MinAngle"),
    pushBack: numOrDefault(f, "PushBackMod"),
    door: numOrDefault(f, "DoorDamage"),
    tree: numOrDefault(f, "TreeDamage"),
    weaponLength: numOrDefault(f, "WeaponLength"),
    twoHand,
    bothHands: parseBool(f.RequiresEquippedBothHands) === true,
    ranged,
    aimedFirearm: parseBool(f.IsAimedFirearm) === true,
    knockBackOnNoDeath: parseBool(f.KnockBackOnNoDeath),
    alwaysKnockdown: parseBool(f.AlwaysKnockdown) === true,
    damageMakeHole: parseBool(f.DamageMakeHole) === true,
    damageCategory: f.DamageCategory || null,
    sharpness: parseNum(f.Sharpness),
    closeKillMove: f.CloseKillMove || null,
    attachmentType: f.AttachmentType || null,
    swingAnim: f.SwingAnim || null,
    ammoType: f.AmmoType || null,
    ammoBox: f.AmmoBox || null,
    magazineType: f.MagazineType || null,
    maxAmmo: parseNum(f.MaxAmmo),
    hitChance: parseNum(f.HitChance),
    aimingTime: parseNum(f.Aimingtime),
    reloadTime: parseNum(f.Reloadtime),
    recoilDelay: parseNum(f.RecoilDelay),
    soundRadius: parseNum(f.SoundRadius),
    soundVolume: parseNum(f.SoundVolume),
    jamGunChance: parseNum(f.JamGunChance),
    projectileCount: parseNum(f.Projectilecount) ?? parseNum(f.ProjectileCount),
    fireMode: f.FireMode || null,
    fireModes: f.FireModePossibilities ? f.FireModePossibilities.split("/").map((s) => s.trim()) : [],
    cyclicRate: parseNum(f.CyclicRateMultiplier),
    piercing: parseBool(f.PiercingBullets) === true,
    explosionPower: parseNum(f.ExplosionPower),
    explosionRange: parseNum(f.ExplosionRange),
    explosionTimer: parseNum(f.ExplosionTimer),
    fireRange: parseNum(f.FireRange),
    smokeRange: parseNum(f.SmokeRange),
    noiseRange: parseNum(f.NoiseRange),
    canBePlaced: parseBool(f.CanBePlaced) === true,
    useSelf: parseBool(f.UseSelf) === true,
    physicsObject: f.PhysicsObject || null,
    metalValue: parseNum(f.MetalValue),
    tooltip: f.Tooltip || null,
    debug
  };
  w.family = familyOf(w);
  w.skillKey = w.family === "firearm" ? "firearm"
    : w.family === "explosive" ? "explosive"
    : w.family === "thrown" ? "thrown"
    : w.family === "unarmed" ? "unarmed"
    : w.family === "debug" ? "debug"
    : (w.primarySkill || "uncategorized");
  w.derived = {
    avgDamage,
    expectedStanding,
    expectedFloor,
    combatSpeedUnskilled: combatSpeed,
    damagePerWeight: weight > 0 ? avgDamage / weight : null,
    expectedPerWeight: weight > 0 ? expectedStanding / weight : null,
    expectedHitsToBreak: condMax * condChance,
    enduranceSwingStrength5: (weight * 0.15 * enduranceMod * 0.3) * 4 * 2 * 0.65 * (twoHand ? 0.5 : 1),
    rangeSpan: w.maxRange - w.minRange,
    damageSpan: maxDamage - minDamage
  };
  return w;
});

const skillLabels = {
  "base:axe": "Axe", "base:blunt": "Blunt", "base:smallblunt": "SmallBlunt",
  "base:smallblade": "SmallBlade", "base:longblade": "LongBlade", "base:spear": "Spear",
  "base:unarmed": "Unarmed", firearm: "Firearm", explosive: "Explosive", thrown: "Thrown",
  unarmed: "Unarmed", debug: "Debug", uncategorized: "Uncategorized"
};

const bySkill = {};
const byFamily = {};
const byDisplayCategory = {};
for (const w of weapons) {
  bySkill[w.skillKey] = (bySkill[w.skillKey] || 0) + 1;
  byFamily[w.family] = (byFamily[w.family] || 0) + 1;
  byDisplayCategory[w.displayCategory] = (byDisplayCategory[w.displayCategory] || 0) + 1;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  source: {
    script: "media/scripts/generated/items/weapon.txt",
    names: "media/lua/shared/Translate/EN/ItemName.json",
    combat: "IsoGameCharacter.calculateCombatSpeed / Hit / muscle strain",
    defaults: DEFAULTS
  },
  generatedAt: new Date().toISOString(),
  count: weapons.length,
  skillLabels, bySkill, byFamily, byDisplayCategory, weapons
}));
console.log("wrote", weapons.length, "weapons ->", OUT);
