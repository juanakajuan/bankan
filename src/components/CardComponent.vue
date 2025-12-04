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

const autoResizeTextarea = (): void => {
  if (inputRef.value) {
    inputRef.value.style.height = "auto";
    inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
  }
};

watch(editedTitle, () => {
  if (isEditing.value) {
    nextTick(() => {
      autoResizeTextarea();
    });
  }
});

const saveEdit = (): void => {
  if (editedTitle.value.trim()) {
    emit("update-card", editedTitle.value.trim());
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
  editedTitle.value = props.card.title;
  isEditing.value = false;
};

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
  border-radius: 5px;
  margin-bottom: 8px;
  border: 1px solid rgba(156, 141, 139, 0.2);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.24);
  cursor: grab;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  min-height: 20px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.card:hover {
  background-color: var(--md-surface-variant);
  border-color: rgba(156, 141, 139, 0.35);
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 3px 6px rgba(0, 0, 0, 0.3);
}

.card:active:not(.is-editing) {
  cursor: grabbing;
}

.card.is-editing {
  cursor: text;
}

.delete-btn {
  opacity: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--md-primary);
  padding: 0 4px;
  border-radius: 5px;
}

.delete-btn:hover {
  background-color: var(--md-on-secondary);
  color: var(--md-secondary);
}

.card:hover .delete-btn {
  opacity: 1;
}

.card-title {
  word-break: break-word; /* Prevents long words from breaking layout */
}

.edit-input {
  color: var(--md-on-background);
  width: 100%;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  outline: 2px solid var(--md-primary);
  background: transparent;
  border-radius: 5px;
  resize: none;
  overflow: hidden;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
