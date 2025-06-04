<script lang="ts">
  import Fa from 'svelte-fa';
  import CategorySelector from '$components/features/CategorySeletor/CategorySelector.svelte';
  import ResultList from '$components/features/ResultList/ResultList.svelte';
  import {
    faSearch,
    faList,
    faHourglassStart,
  } from '@fortawesome/free-solid-svg-icons';

  let searchString: string = '';
  let searchedXML: string = '';
</script>

<div class="search-container">
  <header class="search-header">
    <h1>검색</h1>
  </header>

  <main class="search-main">
    <div class="searchbar-container container">
      <div class="searchbar-title title">
        <h5>검색어</h5>
        <Fa icon={faSearch} />
      </div>
      <input
        type="text"
        placeholder="    검색어를 입력하세요"
        bind:value={searchString}
        class="search-input"
      />
    </div>
    <div class="category-container container">
      <div class="category-title title">
        <h5>카테고리 필터</h5>
        <Fa icon={faList} />
      </div>
      <CategorySelector />
    </div>
    <div class="submit-container container">
      <button type="submit" class="search-button">
        검색
        <Fa icon={faSearch} />
      </button>
    </div>
    <hr style="width: 90vw; margin: 2rem 5%;" />
    <div class="result-container container">
      <div class="result-title title">
        <h5>검색 결과</h5>
        <Fa icon={faHourglassStart} />
      </div>
      <!-- ResultList 컴포넌트는 검색 결과를 표시하는 부분입니다. -->
      <p>검색 결과가 여기에 표시됩니다.</p>
      <ResultList
        searchURL={import.meta.env.VITE_KHSAPI_URL}
        keyword={searchString}
      />
    </div>
  </main>
</div>

<style>
  .search-main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
  }

  .container {
    display: flex;
    justify-content: center;
    align-items: start;
    flex-direction: column;
    padding: 0 5%;
    height: auto;
  }

  .title {
    display: flex;
    align-items: center;
    padding: 0;
    margin: 0;
    gap: 0.5rem;
    font-size: 1.5rem;
    color: var(--text-color);
  }

  .title h5 {
    margin: 0;
    padding: 0;
    font-size: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0;
    margin: 1rem 0;
    border: 1px solid #ccc;
    border-radius: 10px;
    font-size: 1rem;
    width: 100%;
    height: 40px;
    background-color: var(--background-color);
  }

  .search-button {
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 10px;
    background-color: var(--primary-color);
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
</style>
