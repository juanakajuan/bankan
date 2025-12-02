<template>
  <div class="board-view">
    <h1>{{ boardStore.boardData.title }}</h1>

    <div class="board-content">
      <ListContainer
        v-for="list in boardStore.boardData.lists"
        :key="list.id"
        :list="list"
        @delete-list="boardStore.deleteList($event)"
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
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBoardStore } from "@/stores/boardStore";
import ListContainer from "@/components/ListContainer.vue";

const boardStore = useBoardStore();

const newListTitle = ref<string>("");

const handleAddList = (): void => {
  if (newListTitle.value.trim()) {
    boardStore.addList(newListTitle.value.trim());
    newListTitle.value = "";
  }
};
</script>

<style scoped>
.board-view {
  padding: 20px;
}

.board-content {
  display: flex;
  gap: 15px;
  overflow-x: auto;
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
</style>
