<script lang="ts">
  import type { ResultListProps } from './ResultList';
  import {} from '$stores/store';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let { searchURL, keyword }: ResultListProps = $props();

  onMount(() => {});
</script>

<div></div>
