<script lang="ts">
  import OffcanvasTab from '../OffcanvasTab/OffcanvasTab.svelte';
  import {
    categories,
    searchFilters,
    selectedDetailedCategories,
  } from '$lib/store';
  import type { Category } from '$lib/store';
  import { get } from 'svelte/store';

  let isOpen = $state(false);

  // 선택된 카테고리를 저장하는 변수
  let selectedMain = $state<Category | null>(null);
  let selectedSub = $state<Category | null>(null);
  // 선택된 카테고리들을 저장하는 배열
  let selectedCategories: Category[] = [];

  let mainCategories = $derived(categories);
  let subCategories = $derived(selectedMain?.children || []);
  let detailedCategories = $derived(() => {
    if (selectedMain?.addressForDetail) {
      return getDetailedCategories(
        selectedMain.addressForDetail,
        selectedSub?.id || ''
      );
    }
  });

  // 선택된 서브 카테고리의 상세 카테고리를 api로부터 가져오는 함수
  async function getDetailedCategories(
    url: string,
    ccbaCtcd: string = ''
  ): Promise<Category[]> {
    // xml로 받게 됨.
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      // XML 파싱후 <msg> 태그의 내용을 확인.
      // '성공'이 아니면 에러를 발생시킴.
      const msg = xmlDoc.querySelector('msg');
      if (!msg || msg.textContent !== '성공') {
        throw new Error('Failed to fetch detailed categories');
      }

      //item 태그에는 ccbaLcto(시군구코드,id), ccbaLctoNm(시군구명) 태그가 있음.
      const items = xmlDoc.querySelectorAll('item');
      const categories: Category[] = Array.from(items).map((item) => {
        const id = item.querySelector('ccbaLcto')?.textContent || '';
        const name = item.querySelector('ccbaLctoNm')?.textContent || '';
        return { id, name, children: [] };
      });

      return categories;
    } catch (error) {
      console.error('Error fetching detailed categories:', error);
      return [];
    }
  }

  function openOffcavans() {
    isOpen = true;
  }

  function closeOffcanvas() {
    isOpen = false;
  }
</script>

<div class="category-selector">
  <button class="select-button" onclick={openOffcavans}>분류 선택</button>
</div>
<OffcanvasTab title="분류 선택" bind:isOpen {closeOffcanvas}>
  <div>
    <h4>분류</h4>
  </div>
</OffcanvasTab>

<style>
</style>
