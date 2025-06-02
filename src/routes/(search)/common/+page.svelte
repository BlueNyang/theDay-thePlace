<script lang="ts">
  import type { Category } from '$lib/store';
  import CategorySelector from '../../../components/ui/CategorySeletor/CategorySelector.svelte';

  let name: string = 'hi';
</script>

<div class="search-container">
  <header class="search-header">
    <h1>검색 {name}</h1>
  </header>

  <main class="search-main">
    <CategorySelector />
  </main>
</div>

<style>
</style>
