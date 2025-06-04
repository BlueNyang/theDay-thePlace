import { writable } from 'svelte/store';
import khsCategoryData from '$data/khsCategories.json';
import visitKorAreaData from '$data/visitKorAreaCode2.json';

export interface Category {
	code: string;
	name: string;
	item: Category[];
}

export interface SearchedItem {
	type: string;
	name: string;
	ctcdName: string;
	admin: string;
	longitude: number;
	latitude: number;
}

export const ccbaList: Category[] = khsCategoryData;
export const visitKorAreaCode2: Category[] = visitKorAreaData;

export const searchFilter = writable<Category[]>([]);
export const searchKeyword = writable<string>('');
export const searchedItems = writable<SearchedItem[]>([]);
