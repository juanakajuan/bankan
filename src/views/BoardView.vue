<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="board-view loading-view">
    <LoadingSpinner />
  </div>

  <!-- Loaded State -->
  <div class="board-view" v-else-if="currentBoard">
    <div class="board-header">
      <router-link to="/" class="btn btn--secondary btn--sm back-button">Back</router-link>
      <h1 class="board-title"><span class="prompt">&gt;</span> {{ currentBoard.title }}</h1>
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
    <h2>ERROR 404</h2>
    <p>The board you're looking for doesn't exist or has been deleted.</p>
    <router-link to="/" class="btn btn--secondary btn--md">Return to Dashboard</router-link>
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

const boardId = computed<string>(() => route.params.id as string);
const currentBoard = computed(() => boardsStore.getBoardById(boardId.value));

const loadBoard = async (): Promise<void> => {
  isLoading.value = true;
  await boardsStore.fetchBoardById(boardId.value);
  isLoading.value = false;
};

onMounted(() => {
  loadBoard();
});

watch(boardId, () => {
  loadBoard();
});

const handleAddList = async (): Promise<void> => {
  if (newListTitle.value.trim() && currentBoard.value) {
    await boardsStore.addList(currentBoard.value.id, newListTitle.value.trim());
    newListTitle.value = "";
  }
};

const handleDeleteList = async (listId: string): Promise<void> => {
  if (currentBoard.value) {
    await boardsStore.deleteList(currentBoard.value.id, listId);
  }
};
</script>

<style scoped>
.board-view {
  padding: var(--space-4);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.board-header {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-3);
}

.back-button {
  display: inline-flex;
  margin-bottom: var(--space-2);
}

.board-title {
  padding: var(--space-2) 0;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.prompt {
  color: var(--accent);
}

.board-content {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-height: 0;
  padding-bottom: var(--space-4);
}

.add-list-section {
  flex-shrink: 0;
  width: 272px;
  padding: var(--space-2);
  background-color: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  height: fit-content;
}

.add-list-section input {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  border: 1px solid transparent;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  outline: none;
}

.add-list-section input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.8;
}

.add-list-section input:hover {
  border-color: var(--border);
}

.add-list-section input:focus {
  border-color: var(--accent);
}

.board-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: var(--space-4);
  gap: var(--space-4);
}

.board-not-found h2 {
  margin: 0;
  font-size: var(--text-xl);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--accent);
}

.board-not-found p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-base);
}

.loading-view {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
  white-space: nowrap;
  text-decoration: none;
}

.btn--sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
}

.btn--md {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.btn--secondary {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.btn--secondary:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--text-tertiary);
}
</style>
