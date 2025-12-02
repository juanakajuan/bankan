<template>
  <div class="list-container">
    <div class="list-header">
      <h3>{{ props.list.title }}</h3>

      <button class="delete-list-btn" @click.stop="handleDeleteList" title="Delete List">
        &times;
      </button>
    </div>

    <div class="card-area">
      <CardComponent
        v-for="card in props.list.cards"
        :key="card.id"
        :card="card"
        @delete-card="boardStore.deleteCard(props.list.id, $event)"
        @update-card="(newTitle) => boardStore.updateCard(props.list.id, card.id, newTitle)"
      />
    </div>

    <div class="add-card-input">
      <input v-model="newCardTitle" @keyup.enter="handleAddCard" placeholder="+ Add a card" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { List } from "@/types";
import { useBoardStore } from "@/stores/boardStore";
import CardComponent from "./CardComponent.vue";

const props = defineProps<{
  list: List;
}>();

const emit = defineEmits<{
  (e: "delete-list", listId: string): void;
}>();

const boardStore = useBoardStore();

const newCardTitle = ref<string>("");

const handleDeleteList = (): void => {
  emit("delete-list", props.list.id);
};

const handleAddCard = (): void => {
  if (newCardTitle.value.trim()) {
    boardStore.addCard(props.list.id, newCardTitle.value.trim());
    newCardTitle.value = "";
  }
};
</script>

<style scoped>
.list-container {
  flex-shrink: 0;
  width: 272px;
  background-color: var(--md-surface);
  border-radius: 3px;
  padding: 8px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 4px;
  gap: 8px;
}

.list-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
}

.delete-list-btn {
  opacity: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--md-primary);
  padding: 0 4px;
  border-radius: 3px;
}

.delete-list-btn:hover {
  background-color: var(--md-on-secondary);
  color: var(--md-secondary);
}

.list-container:hover .delete-list-btn {
  opacity: 1;
}

.card-area {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 8px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 3px;
  border: none;
}
</style>
