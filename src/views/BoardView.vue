<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="board-view">
    <div class="board-header">
      <div class="skeleton-back"></div>
      <div class="skeleton-board-title"></div>
    </div>
    <div class="board-content">
      <div v-for="i in 3" :key="i" class="skeleton-list">
        <div class="skeleton-list-header"></div>
        <div class="skeleton-card-item" v-for="j in 3" :key="j"></div>
      </div>
    </div>
  </div>

  <!-- Loaded State -->
  <div class="board-view" v-else-if="currentBoard">
    <div class="board-header">
      <router-link to="/" class="back-button">← Back to Dashboard</router-link>
      <h1 class="board-title">
        {{ currentBoard.title }}
      </h1>
    </div>

    <div class="board-content">
      <ListContainer
        v-for="list in currentBoard.lists"
        :key="list.id"
        :list="list"
        :board-id="currentBoard.id"
        @delete-list="handleDeleteList"
      />

      <div class="add-list-section">
        <input
          v-model="newListTitle"
          @keyup.enter="handleAddList"
          placeholder="+ Add another list"
        />
      </div>
    </div>
  </div>

  <!-- Not Found State -->
  <div class="board-not-found" v-else>
    <h2>Board not found</h2>
    <p>The board you're looking for doesn't exist or has been deleted.</p>
    <router-link to="/" class="return-link">Return to Dashboard</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useBoardsStore } from "@/stores/boardsStore";
import ListContainer from "@/components/ListContainer.vue";

const route = useRoute();
const boardsStore = useBoardsStore();

const isLoading = ref<boolean>(true);
const newListTitle = ref<string>("");

/**
 * Computed property that extracts the board ID from the current route parameters.
 */
const boardId = computed<string>(() => route.params.id as string);

/**
 * Computed property that retrieves the current board from the store by its ID.
 * Returns undefined if the board is not found.
 */
const currentBoard = computed(() => boardsStore.getBoardById(boardId.value));

/**
 * Fetches board data from the store and manages loading state.
 *
 * @remarks
 * Sets loading to true before fetching and false after completion.
 * Called on component mount and when the board ID changes.
 *
 * @returns Promise that resolves when the board data is loaded
 */
const loadBoard = async (): Promise<void> => {
  isLoading.value = true;
  await boardsStore.fetchBoardById(boardId.value);
  isLoading.value = false;
};

onMounted(() => {
  loadBoard();
});

/**
 * Watches for route changes to reload board data when navigating between boards.
 */
watch(boardId, () => {
  loadBoard();
});

/**
 * Handles adding a new list to the current board.
 *
 * @remarks
 * - Validates that the title is not empty (after trimming whitespace)
 * - Validates that a current board exists
 * - Clears the input field after successful addition
 * - Triggered on Enter key press in the add list input
 *
 * @returns Promise that resolves when the list is added
 */
const handleAddList = async (): Promise<void> => {
  if (newListTitle.value.trim() && currentBoard.value) {
    await boardsStore.addList(currentBoard.value.id, newListTitle.value.trim());
    newListTitle.value = "";
  }
};

/**
 * Handles deleting a list from the current board.
 *
 * @remarks
 * Validates that a current board exists before attempting deletion.
 * Called by the ListContainer component through event emission.
 *
 * @param listId - The unique identifier of the list to delete
 * @returns Promise that resolves when the list is deleted
 */
const handleDeleteList = async (listId: string): Promise<void> => {
  if (currentBoard.value) {
    await boardsStore.deleteList(currentBoard.value.id, listId);
  }
};
</script>

<style scoped>
.board-view {
  padding: 20px 20px 0 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.board-header {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.back-button {
  display: inline-block;
  color: var(--md-primary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background-color: var(--md-surface);
}

.board-title {
  padding: 8px 12px;
  margin: 0;
  width: fit-content;
}

.board-content {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-height: 0;
  padding-bottom: 20px;
}

.add-list-section {
  flex-shrink: 0;
  width: 272px;
  padding: 8px;
  background-color: var(--md-surface);
  border-radius: 5px;
  height: fit-content;
}

.add-list-section input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 5px;
  border: none;
  background-color: var(--md-surface);
  color: var(--md-on-background);
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.add-list-section input::placeholder {
  color: var(--md-outline);
  opacity: 0.8;
}

.add-list-section input:hover {
  background-color: var(--md-on-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.add-list-section input:focus {
  background-color: var(--md-on-secondary);
  box-shadow: 0 0 0 2px var(--md-primary);
}

.board-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
}

.board-not-found h2 {
  margin: 0 0 12px 0;
  font-size: 32px;
}

.board-not-found p {
  margin: 0 0 24px 0;
  color: var(--md-outline);
}

.return-link {
  color: var(--md-primary);
  text-decoration: none;
  font-size: 16px;
  padding: 10px 20px;
  border-radius: 4px;
  background-color: var(--md-surface);
  transition: background-color 0.2s ease;
}

.return-link:hover {
  background-color: var(--md-on-secondary);
}

/* Skeleton Loader Styles */
.skeleton-back,
.skeleton-board-title,
.skeleton-list-header,
.skeleton-card-item {
  background: linear-gradient(
    90deg,
    var(--md-surface-variant) 25%,
    var(--md-on-secondary) 50%,
    var(--md-surface-variant) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-back {
  height: 20px;
  width: 150px;
  margin-bottom: 8px;
}

.skeleton-board-title {
  height: 36px;
  width: 250px;
}

.skeleton-list {
  flex-shrink: 0;
  width: 272px;
  background-color: var(--md-surface);
  border-radius: 5px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-list-header {
  height: 28px;
  width: 80%;
}

.skeleton-card-item {
  height: 60px;
  width: 100%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
