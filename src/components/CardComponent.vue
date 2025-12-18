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
  background-color: var(--bg-tertiary);
  padding: var(--space-2);
  margin-bottom: var(--space-2);
  border: 1px solid var(--border);
  border-left: 2px solid var(--border-light);
  cursor: grab;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 20px;
  transition: all var(--transition-fast);
}

.card:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--border-light);
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
  color: var(--accent);
  padding: 0 var(--space-1);
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
}

.delete-btn:hover {
  border-color: var(--accent);
}

.card:hover .delete-btn {
  opacity: 1;
}

.card-title {
  word-break: break-word;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.card-title::before {
  content: "- ";
  color: var(--text-secondary);
}

.edit-input {
  color: var(--text-primary);
  width: 100%;
  border: 1px solid var(--border);
  padding: var(--space-1);
  font-family: inherit;
  font-size: var(--text-sm);
  outline: none;
  background: var(--bg-secondary);
  resize: none;
  overflow: hidden;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.edit-input:focus {
  border-color: var(--accent);
}
</style>
