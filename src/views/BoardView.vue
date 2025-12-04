<template>
  <div class="board-view">
    <h1 v-if="!isEditingTitle" @click="startEditingTitle" class="board-title">
      {{ boardStore.boardData.title }}
    </h1>
    <input
      v-else
      v-model="editingTitle"
      @blur="finishEditingTitle"
      @keyup.enter="finishEditingTitle"
      @keyup.esc="cancelEditingTitle"
      class="board-title-input"
      ref="titleInput"
    />

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
import { ref, nextTick } from "vue";
import { useBoardStore } from "@/stores/boardStore";
import ListContainer from "@/components/ListContainer.vue";

const boardStore = useBoardStore();

const newListTitle = ref<string>("");
const isEditingTitle = ref<boolean>(false);
const editingTitle = ref<string>("");
const titleInput = ref<HTMLInputElement | null>(null);

const handleAddList = (): void => {
  if (newListTitle.value.trim()) {
    boardStore.addList(newListTitle.value.trim());
    newListTitle.value = "";
  }
};

const startEditingTitle = (): void => {
  isEditingTitle.value = true;
  editingTitle.value = boardStore.boardData.title;
  nextTick(() => {
    titleInput.value?.focus();
    titleInput.value?.select();
  });
};

const finishEditingTitle = (): void => {
  if (editingTitle.value.trim()) {
    boardStore.updateBoardTitle(editingTitle.value.trim());
  }
  isEditingTitle.value = false;
};

const cancelEditingTitle = (): void => {
  isEditingTitle.value = false;
  editingTitle.value = "";
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

.board-title {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 5px;
  transition: background-color 0.2s ease;
  margin: 0 0 20px 0;
  width: fit-content;
  flex-shrink: 0;
}

.board-title:hover {
  background-color: var(--md-surface);
}

.board-title-input {
  font-size: 2em;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 5px;
  border: none;
  background-color: var(--md-surface);
  color: var(--md-on-background);
  font-family: inherit;
  outline: none;
  box-shadow: 0 0 0 2px var(--md-primary);
  margin: 0 0 20px 0;
  width: auto;
  min-width: 600px;
  flex-shrink: 0;
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
</style>
