<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="board-view loading-view">
    <LoadingSpinner />
  </div>

  <!-- Loaded State -->
  <div class="board-view" v-else-if="currentBoard">
    <div class="board-header">
      <router-link to="/" class="back-button">Back to Dashboard</router-link>
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
import LoadingSpinner from "@/components/LoadingSpinner.vue";

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
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--term-green);
  margin: 10px;
  position: relative;
}

.board-view::before {
  content: "[ BOARD VIEW ]";
  position: absolute;
  top: -12px;
  left: 20px;
  background: var(--md-background);
  padding: 0 10px;
  font-size: 12px;
  color: var(--term-green);
  letter-spacing: 2px;
}

.board-header {
  flex-shrink: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--term-green);
  padding-bottom: 15px;
}

.back-button {
  display: inline-block;
  color: var(--term-green);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.back-button::before {
  content: "< ";
}

.back-button:hover {
  border-color: var(--term-green);
  box-shadow: var(--term-glow);
}

.board-title {
  padding: 8px 12px;
  margin: 0;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.board-title::before {
  content: "> ";
  color: var(--term-green);
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
  border: 1px dashed var(--term-green);
  height: fit-content;
}

.add-list-section input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid transparent;
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
  border-color: var(--term-green);
}

.add-list-section input:focus {
  border-color: var(--term-green);
  box-shadow: var(--term-glow);
}

.board-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
  border: 1px solid var(--md-error);
  margin: 10px;
}

.board-not-found::before {
  content: "! ERROR 404 !";
  font-size: 18px;
  color: var(--md-error);
  margin-bottom: 20px;
  animation: terminal-blink 0.5s step-end infinite;
}

.board-not-found h2 {
  margin: 0 0 12px 0;
  font-size: 28px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--md-error);
}

.board-not-found p {
  margin: 0 0 24px 0;
  color: var(--md-outline);
}

.return-link {
  color: var(--term-green);
  text-decoration: none;
  font-size: 14px;
  padding: 10px 20px;
  border: 1px solid var(--term-green);
  background-color: transparent;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.return-link:hover {
  background-color: var(--term-green);
  color: var(--md-background);
  box-shadow: var(--term-glow);
}

.loading-view {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
