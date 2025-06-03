import { writable } from 'svelte/store';
import categoryData from '../data/khsCategories.json';

export interface Category {
	id: string;
	name: string;
	children?: Category[];
	addressForDetail?: string; // Optional address for fetching children categories
}

export interface SearchFilter {
	categoryType: string;
	categoryId: string;
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
export const categoryStore: Category[] = [];
export const searchFilters = writable<SearchFilter[]>([]);
export const searchResults = writable<SearchResult[]>([]);
