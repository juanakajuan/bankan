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

/**
 * Watches for changes to the list cards and syncs with local copy.
 * Uses deep watching to detect changes within the cards array.
 */
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

/**
 * Handles the end of a drag operation.
 * Persists the new card order to the store.
 */
const handleDragEnd = async (): Promise<void> => {
  isDragging.value = false;
  await boardsStore.updateCardPositions(props.boardId, props.list.id, localCards.value);
};

/**
 * Handles deletion of the list.
 * Emits delete-list event to parent component.
 */
const handleDeleteList = (): void => {
  emit("delete-list", props.list.id);
};

/**
 * Adds a new card to the list if the title is valid.
 * Clears the input after successful addition.
 */
const handleAddCard = async (): Promise<void> => {
  if (newCardTitle.value.trim()) {
    await boardsStore.addCard(props.boardId, props.list.id, newCardTitle.value.trim());
    newCardTitle.value = "";
  }
};

/**
 * Handles deletion of a card from the list.
 * @param cardId - The id of the card to delete
 */
const handleDeleteCard = async (cardId: string): Promise<void> => {
  await boardsStore.deleteCard(props.boardId, props.list.id, cardId);
};

/**
 * Handles updating a card's title.
 * @param cardId - The id of the card to update
 * @param newTitle - The new title for the card
 */
const handleUpdateCard = async (cardId: string, newTitle: string): Promise<void> => {
  await boardsStore.updateCard(props.boardId, props.list.id, cardId, newTitle);
};

/**
 * Enters edit mode for the list title.
 * Copies the current title to the edit buffer and focuses the input.
 */
const startEditing = (): void => {
  editedTitle.value = props.list.title;
  isEditing.value = true;
  shouldSaveOnBlur.value = true;

  nextTick(() => {
    inputRef.value?.focus();
  });
};

/**
 * Saves the edited list title if valid (non-empty after trimming).
 * Persists changes to the store and exits edit mode.
 */
const saveEdit = async (): Promise<void> => {
  if (editedTitle.value.trim()) {
    await boardsStore.updateList(props.boardId, props.list.id, editedTitle.value.trim());
  }

  isEditing.value = false;
};

/**
 * Handles blur event on the input field.
 * Only saves if shouldSaveOnBlur flag is true.
 */
const handleBlur = (): void => {
  if (shouldSaveOnBlur.value) {
    saveEdit();
  }
};

/**
 * Cancels the edit operation without saving changes.
 * Reverts the edited title to the original and exits edit mode.
 */
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
  border: 1px solid var(--term-green);
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.list-container::before {
  content: "[ LIST ]";
  position: absolute;
  top: -10px;
  left: 10px;
  background: var(--md-background);
  padding: 0 8px;
  font-size: 10px;
  color: var(--term-green);
  letter-spacing: 1px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 4px;
  gap: 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--term-green);
  padding-bottom: 8px;
}

.list-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex-grow: 1;
  cursor: text;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.list-title {
  cursor: pointer;
  padding: 4px;
}

.list-title::before {
  content: "> ";
  color: var(--term-green);
}

.list-header:hover {
  background-color: var(--md-surface-variant);
}

.edit-input {
  color: var(--md-on-background);
  width: 100%;
  border: 1px solid var(--term-green);
  padding: 4px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  background: var(--md-surface);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.edit-input:focus {
  box-shadow: var(--term-glow);
}

.delete-list-btn {
  opacity: 0;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--md-error);
  padding: 0 4px;
}

.delete-list-btn:hover {
  border-color: var(--md-error);
  box-shadow: 0 0 5px rgba(255, 85, 85, 0.5);
}

.list-header:hover .delete-list-btn {
  opacity: 1;
}

.card-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 8px;
  min-height: 20px;
  padding-right: 4px;
}

.add-card-input {
  flex-shrink: 0;
  border-top: 1px dashed var(--term-green);
  padding-top: 8px;
}

.add-card-input input {
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

.add-card-input input::placeholder {
  color: var(--md-outline);
  opacity: 0.8;
}

.add-card-input input:hover {
  border-color: var(--term-green);
}

.add-card-input input:focus {
  border-color: var(--term-green);
  box-shadow: var(--term-glow);
}

.ghost-card {
  opacity: 0.4;
  background-color: var(--term-green);
  border: 1px dashed var(--term-green);
}

.dragging-card {
  opacity: 0.8;
  transform: rotate(2deg);
  cursor: grabbing;
  box-shadow: var(--term-glow-strong);
}
</style>
