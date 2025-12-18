<template>
  <div class="list-container">
    <div class="list-header">
      <span class="list__corner">+-</span>
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
      <span class="list__corner">-+</span>
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
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.list__corner {
  color: var(--border-light);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.list-title {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 500;
  margin: 0;
  cursor: text;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-1);
  transition: background-color var(--transition-fast);
}

.list-title:hover {
  background-color: var(--bg-tertiary);
}

.edit-input {
  flex: 1;
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: var(--space-1);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  outline: none;
  background: var(--bg-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.edit-input:focus {
  border-color: var(--accent);
}

.delete-list-btn {
  opacity: 0;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--accent);
  padding: 0 var(--space-1);
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
}

.delete-list-btn:hover {
  border-color: var(--accent);
}

.list-header:hover .delete-list-btn {
  opacity: 1;
}

.card-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: var(--space-2);
  min-height: 20px;
  padding: 0 var(--space-1);
}

.add-card-input {
  flex-shrink: 0;
  border-top: 1px dashed var(--border);
  padding-top: var(--space-2);
}

.add-card-input input {
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

.add-card-input input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.8;
}

.add-card-input input:hover {
  border-color: var(--border);
}

.add-card-input input:focus {
  border-color: var(--accent);
}

.ghost-card {
  opacity: 0.4;
  background-color: var(--bg-tertiary);
  border: 1px dashed var(--border);
}

.dragging-card {
  opacity: 0.8;
  transform: rotate(2deg);
  cursor: grabbing;
}
</style>
