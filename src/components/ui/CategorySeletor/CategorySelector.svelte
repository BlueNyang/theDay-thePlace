<script lang="ts">
  import OffcanvasTab from '../OffcanvasTab/OffcanvasTab.svelte';
  import { categories, categoryStore, searchFilters } from '$lib/store';
  import type { Category, SearchFilter } from '$lib/store';
  import { Fa } from 'svelte-fa';
  import {
    faChevronRight,
    faRotateLeft,
    faXmark,
  } from '@fortawesome/free-solid-svg-icons';
  import { mount, onMount } from 'svelte';

  // 오프캔버스 탭을 열고 닫기 위한 상태 변수
  let isOpen = $state(false);

  // 로딩 상태를 나타내는 변수
  let isLoading = $state(false);
  // 컴포넌트가 마운트되었는지 여부를 나타내는 변수
  let mounted = $state(false);

  // 선택된 카테고리를 저장하는 변수
  let selectedMain = $state<Category | null>(null);
  let selectedSub = $state<Category | null>(null);
  let detailedCategories: Category[] = $state([]);

  // 선택된 카테고리들을 저장하는 배열
  let selectedCategories: Category[] = $state([]);

  // 메인 카테고리를 JSON에서 가져오기
  // $derived를 사용하여 store의 변화를 감지하고 자동으로 업데이트
  let mainCategories: Category[] = $derived(categories);

  // 서브 카테고리는 선택된 메인 카테고리의 children을 가져옴
  // 선택된 메인 카테고리가 변경될 때마다 서브 카테고리를 업데이트
  let subCategories: Category[] = $derived(selectedMain?.children || []);

  // Dock이 열려있는지 여부를 나타내는 변수
  // 선택된 카테고리가 있는 경우 Dock이 열려있다고 판단
  let isDockOpen = $derived(checkDockOpen(selectedCategories));

  // 카테고리 리스트의 높이를 동적으로 설정
  let categoryListHeight: string = $derived(
    isDockOpen
      ? 'calc(100% - 115px - 3rem)' // Dock이 열려있을 때
      : 'calc(100% - 35px)' // Dock이 닫혀있을 때
  );

  // 선택된 서브 카테고리의 상세 카테고리를 가져오기 위한 URL
  let detailedCategoriesURL: string | null = $derived(
    getDetailedCategoriesURL(selectedMain)
  );

  // 도시 선택 후, 시군구 선택을 위한 URL을 생성
  function getDetailedCategoriesURL(
    mainCategory: Category | null
  ): string | null {
    if (mainCategory?.addressForDetail) {
      if (selectedSub) {
        return `${mainCategory.addressForDetail}?${selectedSub.id}`;
      }
    }
    return null;
  }

  // 선택된 서브 카테고리의 상세 카테고리를 api로부터 가져오는 함수
  async function getDetailedCategories(url: string | null): Promise<void> {
    if (!url) {
      detailedCategories = [];
      return;
    }
    // xml로 받게 됨.
    isLoading = true;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        alert('API 요청에 실패하였습니다. 다시 시도해주세요.');
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
        const queryId = `ccbaLcto=${id}`;
        const name = item.querySelector('ccbaLctoNm')?.textContent || '';
        return { id: queryId, name, children: [] };
      });

      isLoading = false;
      detailedCategories = categories;
    } catch (error) {
      console.error('Error fetching detailed categories:', error);
      isLoading = false;
      detailedCategories = [];
    }
  }

  // 선택된 카테고리가 현재 선택된 카테고리인지 확인하는 함수
  function checkIsSelected(
    type: string,
    category: Category,
    dependentcy: any | null = null
  ): boolean {
    if (type === 'main') {
      if (dependentcy === null) return false;
      return selectedMain?.id === category.id;
    } else if (type === 'sub') {
      if (selectedMain?.addressForDetail)
        return selectedSub?.id === category.id;
      else return selectedCategories.some((cat) => cat.id === category.id);
    } else if (type === 'detailed') {
      return selectedCategories.some((cat) => cat.id === category.id);
    }
    return false;
  }

  // 오프캔버스 탭을 열고 닫는 함수
  function openOffcavans(): void {
    isOpen = true;
  }

  // 오프캔버스 탭을 닫는 함수
  function closeOffcanvas(): void {
    isOpen = false;
  }

  function checkDockOpen(selectedCat: Category[]): boolean {
    if (!mounted) return false; // 컴포넌트가 마운트되지 않았으면 false 반환
    if (selectedCat.length > 0) return true;

    const dock = document.getElementById('selected-categories-dock');
    if (dock) {
      dock.classList.remove('dock-display');
      dock.classList.add('dock-closed');
      setTimeout(() => {
        dock.classList.remove('dock-closed');
      }, 500); // 애니메이션 시간과 일치시킴
    }
    return false;
  }

  onMount(() => {
    mounted = true;
    if (categoryStore) {
      selectedCategories = categoryStore;
    }
  });
</script>

<!-- CategorySelector.svelte -->
<!-- 카테고리 선택 버튼 -->
<div class="category-selector">
  <button class="select-button" onclick={openOffcavans}>
    <span>분류를 선택해주세요</span>
    <Fa icon={faChevronRight} />
  </button>
</div>
<!-- 카테고리 선택 버튼 -->
<!-- 선택된 카테고리 -->
<div class="selected-categories">
  {#if selectedCategories.length > 0}
    <span>선택된 카테고리:</span>
    <ul class="selected-category-list">
      {#each selectedCategories as category (category.id)}
        <li class="selected-category-item">
          {category.name}
          <button
            class="remove-button"
            onclick={() => {
              selectedCategories = selectedCategories.filter(
                (cat) => cat.id !== category.id
              );
            }}
          >
            <Fa icon={faXmark} />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
<!-- 선택된 카테고리 -->

<!-- OffcanvasTab 컴포넌트로 카테고리 선택 UI -->
<OffcanvasTab title="분류 선택" bind:isOpen {closeOffcanvas}>
  <!-- Offcanvas body -->
  <div class="offcanvas-body">
    <!-- main-categories -->
    <div class="main-categories category-sector">
      <!-- 대분류 카테고리 리스트 -->
      <div class="category-sector-header">
        <h4>분류</h4>
      </div>
      <!-- 선택된 카테고리들을 보여주는 영역 -->
      <ul class="category-list" style="height: {categoryListHeight};">
        {#each mainCategories as category (category.id)}
          <li
            class:selected={checkIsSelected('main', category, selectedMain)}
            class="category-item"
          >
            <!-- li를 클릭하면 선택되도록하는 버튼 === 투명, wh 100% -->
            <button
              class="category-button"
              onclick={() => {
                selectedMain = category;
                selectedSub = null;
              }}
            >
              {category.name}
            </button>
          </li>
        {/each}
      </ul>
      <!-- 선택된 카테고리들을 보여주는 영역 -->
    </div>
    <!-- main-categories -->

    <!-- sub-categories -->
    <div class="sub-categories category-sector">
      <div class="category-sector-header">
        <h4>중분류</h4>
      </div>
      <ul class="category-list" style="height: {categoryListHeight};">
        {#if selectedMain}
          {#each subCategories as category (category.id)}
            <li
              class:selected={checkIsSelected('sub', category, selectedSub)}
              class="category-item"
            >
              <button
                class="category-button"
                onclick={async () => {
                  selectedSub = category;
                  detailedCategories = [];
                  // 상세 카테고리 API URL이 없으면 현재 level이 최하위
                  if (!selectedMain?.addressForDetail) {
                    if (
                      selectedCategories.some((cat) => cat.id === category.id)
                    ) {
                      selectedCategories = selectedCategories.filter(
                        (cat) => cat.id !== category.id
                      );
                      selectedSub = null;
                    } else {
                      selectedCategories = [...selectedCategories, category];
                    }
                  } else {
                    await getDetailedCategories(detailedCategoriesURL);
                  }
                }}
              >
                {category.name}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
    <!-- sub-categories -->

    <!-- detailed-categories -->
    <div class="detailed-categories category-sector">
      <div class="category-sector-header">
        <h4>소분류</h4>
      </div>
      <ul class="category-list" style="height: {categoryListHeight};">
        {#if !selectedMain}
          <p>메인 카테고리를 선택해주세요.</p>
        {/if}
        {#if isLoading}
          <p>로딩 중...</p>
        {/if}
        {#if selectedSub}
          {#each detailedCategories as category (category.id)}
            <li
              class:selected={checkIsSelected(
                'detailed',
                category,
                detailedCategories
              )}
              class="category-item"
            >
              <button
                class="category-button"
                onclick={() => {
                  if (
                    selectedCategories.some((cat) => cat.id === category.id)
                  ) {
                    selectedCategories = selectedCategories.filter(
                      (cat) => cat.id !== category.id
                    );
                  } else {
                    selectedCategories = [...selectedCategories, category];
                  }
                }}
              >
                {category.name}
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
    <!-- detailed-categories -->
  </div>
  <!-- offcanvas body -->

  <!-- 선택 Dock -->
  <div
    id="selected-categories-dock"
    class="selected-categories-dock"
    class:dock-display={isDockOpen}
    class:dock-closed={false}
  >
    <div class="dock-header">
      <div class="dock-left">
        <span class="dock-header-text">선택된 카테고리</span>
        <!-- 초기화 버튼 section. 정사각형 -->
        <div class="clear-button-section">
          <!-- 초기화 버튼 -->
          <button
            class="clear-button"
            aria-label="선택된 카테고리 초기화"
            onclick={() => {
              selectedCategories = [];
              selectedMain = null;
              selectedSub = null;
              detailedCategories = [];
            }}
          >
            <span class="clear-button-text">초기화</span>
            <Fa icon={faRotateLeft} />
          </button>
          <!-- 초기화 버튼 -->
        </div>
        <!-- 초기화 버튼 section -->
      </div>
      <!-- 적용 버튼 section -->
      <div class="apply-button-section">
        <!-- 적용 버튼 -->
        <button
          class="apply-button"
          aria-label="선택된 카테고리 적용"
          onclick={() => {
            // 선택된 카테고리를 searchFilters에 저장
            const result: SearchFilter[] = Array.from(
              selectedCategories.map((cat): SearchFilter => {
                const type: string = cat.id.split('=')[0];
                const value: string = cat.id.split('=')[1];
                return {
                  categoryType: type,
                  categoryId: value,
                };
              })
            );
            searchFilters.set(result);
            closeOffcanvas();
          }}
        >
          <span class="clear-button-text">적용</span>
          <Fa icon={faXmark} />
        </button>
      </div>
      <!-- 적용 버튼 section -->
    </div>

    <!-- 선택된 카테고리들을 보여주는 Dock -->
    <div class="dock-body">
      <!-- div clear button section -->
      <!-- div tag list -->
      <div class="category-tag-area">
        <ul class="category-tag-list">
          {#each selectedCategories as category (category.id)}
            <li class="category-tag-item">
              <button
                class="tag-remove-button"
                onclick={() => {
                  selectedCategories = selectedCategories.filter(
                    (cat) => cat.id !== category.id
                  );
                }}
              >
                <Fa icon={faXmark} />
              </button>
              <span class="category-item-name">{category.name}</span>
            </li>
          {/each}
        </ul>
      </div>
      <!-- div tag list -->
    </div>
  </div>
  <!-- 선택 Dock -->
</OffcanvasTab>

<style>
  /* 카테고리 선택기 */
  .category-selector {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0.5rem 0;
    padding: 2rem 0;
    width: 100%;
    height: 50px;
  }

  /* 카테고리 선택 버튼 */
  .select-button {
    display: flex;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 4px;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.3s ease;
    width: 80%;
  }

  /* 카테고리 선택 버튼 hover 효과 */
  .select-button:hover {
    background-color: var(--hover-color);
  }

  /* 오프캔버스 탭 */
  .offcanvas-body {
    display: flex;
    flex-direction: row;
    margin: 0;
    padding: 0;
    height: 100%;
    justify-content: space-between;
  }

  /* 카테고리 섹터 */
  .category-sector {
    flex: 1;
    margin-right: 1rem;
    width: 30%;
  }

  /* 카테고리 섹터 헤더 */
  .category-sector-header {
    height: 35px;
    margin: 0;
    padding: 0;
    text-align: center;
    justify-content: center;
    align-items: center;
  }

  /* 카테고리 섹터 헤더 제목 */
  .category-sector-header h4 {
    margin: 0;
    padding: 0;
  }

  /* 카테고리 리스트 */
  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border-radius: 2%;
    border: 1px solid #000;
    overflow-y: auto;
    min-height: 0;
    transition: height 0.5s ease-in-out;
  }

  /* Webkit 브라우저 스크롤바 상세 스타일 */
  .category-list::-webkit-scrollbar {
    width: 10px; /* 스크롤바의 너비 */
  }

  /* 스크롤바 트랙과 막대의 스타일 */
  .category-list::-webkit-scrollbar-track {
    background: transparent; /* 스크롤바 트랙 배경을 투명하게 */
    margin: 2px 0; /* 트랙의 상하 여백 (선택 사항) */
  }

  /* 스크롤바 막대의 스타일 */
  .category-list::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.3); /* 스크롤바 막대 색상 */
    border-radius: 10px; /* 스크롤바 막대 둥글게 */
    border: 2px solid transparent; /* 막대 주변에 투명 테두리를 주어 트랙과 약간의 간격을 만듦 (선택 사항) */
    background-clip: content-box; /* 테두리 안쪽으로 배경색을 적용 */
  }

  /* 스크롤바 막대가 마우스 오버될 때의 스타일 */
  .category-list::-webkit-scrollbar-thumb:hover {
    background-color: #555; /* 마우스 오버 시 스크롤바 막대 색상 */
  }

  /* 카테고리 아이템 */
  .category-item {
    width: 100%;
    margin: 0;
    padding: 0.5rem 0;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
  }

  /* 카테고리 아이템 선택 상태 */
  .category-button {
    width: 100%;
    height: 100%;
    background: none;
    border: none;
    text-align: left;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    color: #333;
    cursor: pointer;
  }

  /* 카테고리 아이템 선택 상태 hover 효과 */
  .category-button:hover {
    background-color: var(--hover-background-color);
  }

  /* 카테고리 아이템 선택 상태 */
  .category-item.selected {
    background-color: var(--selected-background-color);
    color: var(--selected-text-color);
  }

  /* dock 스타일 */
  .selected-categories-dock {
    display: flex;
    position: fixed;
    flex-direction: column;
    height: 80px;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 1rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 30px;
    background-color: var(--background-color);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1050;
    transform: translateY(calc(100% - 2rem)); /* 초기 상태: 화면 아래로 숨김 */
    opacity: 0;
    transition:
      opacity 0.2s ease-in-out,
      transform 0.5s ease-in-out;
  }

  /* dock 헤더 */
  .dock-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 0 0 0.5rem 1rem;
    width: calc(100% - 1rem);
    height: 25%;
    border-bottom: 3px solid var(--border-color);
  }

  /* dock 헤더 왼쪽 영역 */
  .dock-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    width: 100%;
    height: 100%;
  }

  /* dock 탭 헤더 텍스트 */
  .dock-header-text {
    font-size: 1.2rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  /* 초기화 버튼 섹션 */
  .clear-button-section {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    height: 100%;
    width: 100px;
    margin: 0 1rem 0 0;
    padding: 0;
  }

  /* 초기화 버튼 */
  .clear-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.3s ease;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  .apply-button-section {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    height: 100%;
    width: 100px;
    margin: 0 0 0 1rem;
    padding: 0;
    right: 0;
  }

  /* 적용 버튼 */
  .apply-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.3s ease;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }

  /* 초기화 버튼 hover 효과 */
  .clear-button-text {
    font-size: 1rem;
    font-weight: bold;
    color: var(--text-color);
    text-align: center;
  }

  /* dock의 본문 */
  .dock-body {
    display: flex;
    /*align-items: center;*/
    overflow: hidden;
    flex-direction: row;
    margin: 0.5rem 0 0 0;
    padding: 0;
    height: 75%;
  }

  .category-tag-area {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem 0;
  }

  .category-tag-area::-webkit-scrollbar {
    height: 8px;
  }

  .category-tag-area::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }

  /* 스크롤바 막대의 스타일 */
  .category-tag-area::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.3); /* 스크롤바 막대 색상 */
    border-radius: 10px; /* 스크롤바 막대 둥글게 */
    border: 2px solid transparent; /* 막대 주변에 투명 테두리를 주어 트랙과 약간의 간격을 만듦 (선택 사항) */
    background-clip: content-box; /* 테두리 안쪽으로 배경색을 적용 */
  }

  /* 스크롤바 막대가 마우스 오버될 때의 스타일 */
  .category-tag-area::-webkit-scrollbar-thumb:hover {
    background-color: #555; /* 마우스 오버 시 스크롤바 막대 색상 */
  }

  .category-tag-area {
    scrollbar-width: thin; /* Firefox에서 스크롤바를 얇게 */
    scrollbar-color: rgba(0, 0, 0, 0.3) transparent; /* Firefox에서 스크롤바 색상 */
  }

  /* dock의 선택된 카테고리 태그 영역 */
  .category-tag-list {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    padding: 0 1rem;
    margin: 0;
    display: flex;
    list-style: none;
    gap: 0.5rem;
  }

  /* 카테고리 태그 아이템 */
  .category-tag-item {
    margin: 0;
    padding: 0.25rem 0.5rem;
    display: flex;
    align-items: center;
    height: 26px;
    justify-content: center;
    background-color: #bdbdbd;
    border-radius: 26px;
    color: var(--tag-text-color);
    flex-shrink: 0;
  }

  /* 카테고리 태그 제거 버튼 */
  .tag-remove-button {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    font-size: 1rem;
    margin: 0;
    padding: 0;
    height: 20px;
    width: 20px;
    border-radius: 20px;
  }

  /* 카테고리 태그 제거 버튼 hover 효과 */
  .tag-remove-button:hover {
    background-color: #777;
  }

  /* 카테고리 아이템 이름 */
  .category-item-name {
    padding: 0 0.25rem;
    background-color: var(--tag-background-color);
    border-radius: 4px;
    color: var(--tag-text-color);
    font-size: 0.9rem;
    cursor: default;
  }

  /* dock이 열릴 때 애니메이션 효과 */
  @keyframes dockSlideUp {
    0% {
      opacity: 0;
      transform: translateY(calc(100% + 1rem));
    }
    30% {
      opacity: 1;
      transform: translateY(-10px); /* 살짝 위로 튕기는 효과 */
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* dock이 닫힐 때 애니메이션 효과 */
  @keyframes dockSlideDown {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(-10px); /* 살짝 위로 튕기는 효과 */
    }
    100% {
      opacity: 0;
      transform: translateY(100%);
    }
  }

  /* dock이 열려있을 때와 닫혀있을 때의 클래스 */
  .dock-display {
    animation: dockSlideUp 0.5s ease-in-out forwards;
  }
  .dock-closed {
    animation: dockSlideDown 0.5s ease-in-out forwards;
  }
</style>
