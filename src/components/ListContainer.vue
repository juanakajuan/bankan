<template>
  <div class="list-container">
    <div class="list-header">
      <h3 v-if="!isEditing" @click="startEditing" class="list-title">{{ props.list.title }}</h3>

      <input
        v-else
        ref="inputRef"
        v-model="editedTitle"
        @blur="saveEdit"
        @keydown.enter="saveEdit"
        @keydown.esc="cancelEdit"
        @click.stop
        class="edit-input"
      />

      <button
        v-if="!isEditing"
        class="delete-list-btn"
        @click.stop="handleDeleteList"
        title="Delete List"
      >
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
import { ref, nextTick } from "vue";
import type { List } from "@/types";
import { useBoardStore } from "@/stores/boardStore";
import CardComponent from "./CardComponent.vue";

const props = defineProps<{
  list: List;
}>();

const emit = defineEmits<{
  (e: "update-list", listId: string): void;
  (e: "delete-list", listId: string): void;
}>();

const boardStore = useBoardStore();

const newCardTitle = ref<string>("");
const isEditing = ref<boolean>(false);
const inputRef = ref<HTMLInputElement | null>(null);
const editedTitle = ref<string>("");
const isCancelling = ref<boolean>(false);

const handleDeleteList = (): void => {
  emit("delete-list", props.list.id);
};

const handleAddCard = (): void => {
  if (newCardTitle.value.trim()) {
    boardStore.addCard(props.list.id, newCardTitle.value.trim());
    newCardTitle.value = "";
  }
};

const startEditing = (): void => {
  editedTitle.value = props.list.title;
  isEditing.value = true;
  isCancelling.value = false;

  nextTick(() => {
    inputRef.value?.focus();
  });
};

const saveEdit = (): void => {
  if (isCancelling.value) {
    isCancelling.value = false;
    return;
  }

  if (editedTitle.value.trim()) {
    boardStore.updateList(props.list.id, editedTitle.value.trim());
  }

  isEditing.value = false;
};

const cancelEdit = (): void => {
  isCancelling.value = true;
  editedTitle.value = props.list.title;
  isEditing.value = false;
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
  border-radius: 3px;
}

.list-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
}

.list-title {
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
}

.list-header:hover {
  background-color: var(--md-surface-variant);
}

.edit-input {
  color: var(--md-on-background);
  width: 100%;
  border: none;
  padding: 4px;
  font-family: inherit;
  font-size: 20px;
  font-weight: 600;
  outline: 2px solid var(--md-primary);
  background: var(--md-surface);
  border-radius: 3px;
}

.delete-list-btn {
  opacity: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--md-primary);
  padding: 0 4px;
  border-radius: 3px;
}

.delete-list-btn:hover {
  background-color: var(--md-on-secondary);
  color: var(--md-secondary);
}

.list-header:hover .delete-list-btn {
  opacity: 1;
}

.card-area {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 8px;
}

.add-card-input input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 3px;
  border: none;
  background-color: var(--md-surface-variant);
  color: var(--md-on-background);
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s ease;
  outline: none;
}

.add-card-input input::placeholder {
  color: var(--md-outline);
  opacity: 0.8;
}

.add-card-input input:hover {
  background-color: var(--md-on-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.add-card-input input:focus {
  background-color: var(--md-on-secondary);
  box-shadow: 0 0 0 2px var(--md-primary);
}
</style>
