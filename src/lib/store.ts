import { writable } from 'svelte/store';
import categoryData from '$data/khsCategories.json';

export interface Category {
	id: string;
	name: string;
	children?: Category[];
	addressForDetail?: string; // Optional address for fetching children categories
}

export interface SearchFilter {
	mainCategory: Category | null;
	subCategory: Category | null;
	detailedCategory: Category | null;
}

export interface SearchResult {
	id: string;
	title: string;
	description: string;
	category: string;
	date: string;
	imageUrl?: string;
}

export const categories: Category[] = categoryData;

// search filter store
export const searchFilters = writable<SearchFilter>({
	mainCategory: null,
	subCategory: null,
	detailedCategory: null
});
export const selectedDetailedCategories = writable<Category[]>([]);
export const searchResults = writable<SearchResult[]>([]);
