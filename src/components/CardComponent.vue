<template>
  <div
    class="card"
    :class="{ 'is-editing': isEditing }"
    @click="startEditing"
    :draggable="isDraggable"
    @dragstart="handleDragStart"
  >
    <span v-if="!isEditing" class="card-title">{{ card.title }}</span>

    <textarea
      v-else
      ref="inputRef"
      v-model="editedTitle"
      @blur="handleBlur"
      @keydown.enter.exact="saveEdit"
      @keydown.esc="cancelEdit"
      @click.stop
      class="edit-input"
      rows="1"
    />

    <button
      v-if="!isEditing"
      class="delete-btn"
      @click.stop="emit('delete-card', card.id)"
      title="Delete Card"
    >
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, useTemplateRef } from "vue";
import type { Card } from "@/types";

const props = defineProps<{
  card: Card;
  isDragging?: boolean;
}>();

const emit = defineEmits<{
  (e: "update-card", newTitle: string): void;
  (e: "delete-card", cardId: string): void;
}>();

const isEditing = ref<boolean>(false);
const inputRef = useTemplateRef<HTMLTextAreaElement>("inputRef");
const editedTitle = ref<string>("");
const shouldSaveOnBlur = ref<boolean>(true);

const isDraggable = computed<boolean>(() => !isEditing.value);

/**
 * Enters edit mode for the card title.
 * Copies the current title to the edit buffer and focuses the input.
 */
const startEditing = (): void => {
  editedTitle.value = props.card.title;
  isEditing.value = true;
  shouldSaveOnBlur.value = true;

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
      autoResizeTextarea();
    }
  });
};

/**
 * Automatically adjusts the textarea height to fit its content.
 * Resets height to auto first to allow shrinking, then sets to scrollHeight.
 */
const autoResizeTextarea = (): void => {
  if (inputRef.value) {
    inputRef.value.style.height = "auto";
    inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
  }
};

/**
 * Watches for changes to the edited title and auto-resizes the textarea
 */
watch(editedTitle, () => {
  if (isEditing.value) {
    nextTick(() => {
      autoResizeTextarea();
    });
  }
});

/**
 * Saves the edited title if valid (non-empty after trimming).
 * Emits update-card event and exits edit mode.
 */
const saveEdit = (): void => {
  if (editedTitle.value.trim()) {
    emit("update-card", editedTitle.value.trim());
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
  editedTitle.value = props.card.title;
  isEditing.value = false;
};

/**
 * Prevents drag operation when the card is in edit mode.
 * @param event - The drag event to potentially prevent
 */
const handleDragStart = (event: DragEvent): void => {
  if (isEditing.value) {
    event.preventDefault();
    event.stopPropagation();
  }
};
</script>

<style scoped>
.card {
  background-color: var(--md-surface-variant);
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--term-green);
  border-left: 3px solid var(--term-green);
  cursor: grab;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  min-height: 20px;
  transition: all 0.15s ease;
}

.card:hover {
  background-color: var(--md-surface-variant);
  box-shadow: var(--term-glow);
}

.card:active:not(.is-editing) {
  cursor: grabbing;
}

.card.is-editing {
  cursor: text;
}

.delete-btn {
  opacity: 0;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--md-error);
  padding: 0 4px;
}

.delete-btn:hover {
  border-color: var(--md-error);
  box-shadow: 0 0 5px rgba(255, 85, 85, 0.5);
}

.card:hover .delete-btn {
  opacity: 1;
}

.card-title {
  word-break: break-word;
}

.card-title::before {
  content: "- ";
  color: var(--term-green);
}

.edit-input {
  color: var(--md-on-background);
  width: 100%;
  border: 1px solid var(--term-green);
  padding: 2px 4px;
  font-family: inherit;
  font-size: inherit;
  outline: none;
  background: var(--md-surface);
  resize: none;
  overflow: hidden;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.edit-input:focus {
  box-shadow: var(--term-glow);
}
</style>
