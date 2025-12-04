<template>
  <div class="board-view" v-if="currentBoard">
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
  <div class="board-not-found" v-else>
    <h2>Board not found</h2>
    <p>The board you're looking for doesn't exist or has been deleted.</p>
    <router-link to="/" class="return-link">Return to Dashboard</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useBoardsStore } from "@/stores/boardsStore";
import ListContainer from "@/components/ListContainer.vue";

const route = useRoute();
const boardsStore = useBoardsStore();

const boardId = computed<string>(() => route.params.id as string);
const currentBoard = computed(() => boardsStore.getBoardById(boardId.value));

const newListTitle = ref<string>("");

const handleAddList = (): void => {
  if (newListTitle.value.trim() && currentBoard.value) {
    boardsStore.addList(currentBoard.value.id, newListTitle.value.trim());
    newListTitle.value = "";
  }
};

const handleDeleteList = (listId: string): void => {
  if (currentBoard.value) {
    boardsStore.deleteList(currentBoard.value.id, listId);
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
</style>
