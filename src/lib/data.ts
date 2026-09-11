import dataset from '$lib/data/weapons.json';
import type { Dataset, Weapon } from './types';

export const DATA = dataset as Dataset;
export const WEAPONS: Weapon[] = DATA.weapons;
export const GENERATED_AT = DATA.generatedAt;
export const COUNT = DATA.count;
