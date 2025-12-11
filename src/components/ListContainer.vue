<template>
  <div class="list-container">
    <div class="list-header">
      <h3 v-if="!isEditing" @click="startEditing" class="list-title">{{ props.list.title }}</h3>

      <input
        v-else
        ref="inputRef"
        v-model="editedTitle"
        @blur="handleBlur"
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

    <draggable
      v-model="localCards"
      item-key="id"
      group="cards"
      :animation="150"
      ghost-class="ghost-card"
      drag-class="dragging-card"
      class="card-area"
      @start="isDragging = true"
      @end="handleDragEnd"
    >
      <template #item="{ element: card }">
        <CardComponent
          :card="card"
          :is-dragging="isDragging"
          @delete-card="handleDeleteCard"
          @update-card="(newTitle) => handleUpdateCard(card.id, newTitle)"
        />
      </template>
    </draggable>

    <div class="add-card-input">
      <input v-model="newCardTitle" @keyup.enter="handleAddCard" placeholder="+ Add a card" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, useTemplateRef, watch } from "vue";
import type { List, Card } from "@/types";
import { useBoardsStore } from "@/stores/boardsStore";
import CardComponent from "./CardComponent.vue";
import draggable from "vuedraggable";

const props = defineProps<{
  list: List;
  boardId: string;
}>();

const emit = defineEmits<{
  (e: "delete-list", listId: string): void;
}>();

const boardsStore = useBoardsStore();

const localCards = ref<Card[]>([...props.list.cards]);

// Sync local cards with props when they change
watch(
  () => props.list.cards,
  (newCards) => {
    localCards.value = [...newCards];
  },
  { deep: true },
);

const newCardTitle = ref<string>("");
const isEditing = ref<boolean>(false);
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const editedTitle = ref<string>("");
const isDragging = ref<boolean>(false);
const shouldSaveOnBlur = ref<boolean>(true);

const handleDragEnd = async (): Promise<void> => {
  isDragging.value = false;
  await boardsStore.updateCardPositions(props.boardId, props.list.id, localCards.value);
};

const handleDeleteList = (): void => {
  emit("delete-list", props.list.id);
};

const handleAddCard = async (): Promise<void> => {
  if (newCardTitle.value.trim()) {
    await boardsStore.addCard(props.boardId, props.list.id, newCardTitle.value.trim());
    newCardTitle.value = "";
  }
};

const handleDeleteCard = async (cardId: string): Promise<void> => {
  await boardsStore.deleteCard(props.boardId, props.list.id, cardId);
};

const handleUpdateCard = async (cardId: string, newTitle: string): Promise<void> => {
  await boardsStore.updateCard(props.boardId, props.list.id, cardId, newTitle);
};

const startEditing = (): void => {
  editedTitle.value = props.list.title;
  isEditing.value = true;
  shouldSaveOnBlur.value = true;

  nextTick(() => {
    inputRef.value?.focus();
  });
};

const saveEdit = async (): Promise<void> => {
  if (editedTitle.value.trim()) {
    await boardsStore.updateList(props.boardId, props.list.id, editedTitle.value.trim());
  }

  isEditing.value = false;
};

const handleBlur = (): void => {
  if (shouldSaveOnBlur.value) {
    saveEdit();
  }
};

const cancelEdit = (): void => {
  shouldSaveOnBlur.value = false;
  editedTitle.value = props.list.title;
  isEditing.value = false;
};
</script>

<style scoped>
.list-container {
  flex-shrink: 0;
  width: 272px;
  background-color: var(--md-surface);
  border-radius: 5px;
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 4px;
  gap: 8px;
  border-radius: 5px;
  flex-shrink: 0;
}

.list-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  cursor: text;
}

.list-title {
  cursor: pointer;
  padding: 4px;
  border-radius: 5px;
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
  border-radius: 5px;
}

.delete-list-btn {
  opacity: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--md-primary);
  padding: 0 4px;
  border-radius: 5px;
}

.delete-list-btn:hover {
  background-color: var(--md-on-secondary);
  color: var(--md-secondary);
}

.list-header:hover .delete-list-btn {
  opacity: 1;
}

.card-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 8px;
  min-height: 0;
  padding-right: 4px;
}

.add-card-input {
  flex-shrink: 0;
}

.add-card-input input {
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

.ghost-card {
  opacity: 0.4;
  background-color: var(--md-primary);
}

.dragging-card {
  opacity: 0.8;
  transform: rotate(2deg);
  cursor: grabbing;
}

.card-area {
  min-height: 20px;
}
</style>
