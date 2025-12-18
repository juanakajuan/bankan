<template>
  <div class="board-card" @click="navigateToBoard">
    <div class="board-card__header">
      <span class="card__corner">+-</span>
      <h3 v-if="!isEditing" @click.stop="startEditing" class="card__title">
        {{ props.board.title }}
      </h3>
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
      <span class="card__corner">-+</span>
    </div>

    <div class="board-card__content">
      <div class="board-stats">
        <span>{{ props.board.listCount }} lists</span>
        <span class="separator">|</span>
        <span>{{ props.board.cardCount }} cards</span>
      </div>

      <div class="board-meta">
        <span class="last-modified">Last: {{ formatDate(props.board.lastModified) }}</span>
      </div>
    </div>

    <div class="board-card__actions">
      <button
        v-if="!props.board.isArchived"
        class="btn btn--ghost btn--sm"
        @click.stop="handleArchive"
        title="Archive Board"
      >
        Archive
      </button>
      <button
        v-else
        class="btn btn--secondary btn--sm"
        @click.stop="handleUnarchive"
        title="Restore Board"
      >
        Restore
      </button>
      <button class="btn btn--danger btn--sm" @click.stop="showDeleteModal" title="Delete Board">
        Delete
      </button>
    </div>

    <div class="board-card__footer">
      <span class="card__corner">+-</span>
      <span class="card__line"></span>
      <span class="card__corner">-+</span>
    </div>
  </div>

  <teleport to="body">
    <div v-if="isDeleting" class="modal-overlay animate-fade-in" @click="closeDeleteModal">
      <div class="modal animate-slide-up" @click.stop>
        <div class="modal__header">
          <span class="modal__corner">+-</span>
          <h2 class="modal__title">Delete Board?</h2>
          <span class="modal__corner">-+</span>
        </div>

        <div class="modal__content">
          <p>This action cannot be undone. Type the board name to confirm:</p>
          <p class="board-name-display">{{ props.board.title }}</p>
          <input
            v-model="deleteConfirmation"
            @keydown.enter="confirmDelete"
            placeholder="Type board name here"
            class="confirm-input"
            ref="deleteInputRef"
          />
        </div>

        <div class="modal__actions">
          <button @click="closeDeleteModal" class="btn btn--secondary btn--md">Cancel</button>
          <button
            @click="confirmDelete"
            class="btn btn--danger btn--md"
            :disabled="!isDeleteConfirmed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import type { BoardMetadata } from "@/types";

const props = defineProps<{
  board: BoardMetadata;
}>();

const emit = defineEmits<{
  (e: "delete", boardId: string): void;
  (e: "archive", boardId: string): void;
  (e: "unarchive", boardId: string): void;
  (e: "rename", boardId: string, newTitle: string): void;
}>();

const router = useRouter();

const isEditing = ref<boolean>(false);
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const editedTitle = ref<string>("");
const shouldSaveOnBlur = ref<boolean>(true);
const isDeleting = ref<boolean>(false);
const deleteConfirmation = ref<string>("");
const deleteInputRef = useTemplateRef<HTMLInputElement>("deleteInputRef");

const isDeleteConfirmed = computed<boolean>(() => deleteConfirmation.value === props.board.title);

const navigateToBoard = (): void => {
  if (!isEditing.value && !isDeleting.value) {
    router.push({ name: "board", params: { id: props.board.id } });
  }
};

const startEditing = (): void => {
  editedTitle.value = props.board.title;
  isEditing.value = true;
  shouldSaveOnBlur.value = true;

  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
};

const saveEdit = (): void => {
  if (editedTitle.value.trim()) {
    emit("rename", props.board.id, editedTitle.value.trim());
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
  editedTitle.value = props.board.title;
  isEditing.value = false;
};

const handleArchive = (): void => {
  emit("archive", props.board.id);
};

const handleUnarchive = (): void => {
  emit("unarchive", props.board.id);
};

const showDeleteModal = (): void => {
  isDeleting.value = true;
  deleteConfirmation.value = "";
  nextTick(() => {
    deleteInputRef.value?.focus();
  });
};

const closeDeleteModal = (): void => {
  isDeleting.value = false;
  deleteConfirmation.value = "";
};

const confirmDelete = (): void => {
  if (isDeleteConfirmed.value) {
    emit("delete", props.board.id);
    closeDeleteModal();
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};
</script>

<style scoped>
.board-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-card:hover {
  border-color: var(--border-light);
  background-color: var(--bg-tertiary);
}

.board-card:focus {
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}

.board-card__header {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  gap: var(--space-2);
}

.card__corner {
  color: var(--border-light);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.card__title {
  flex: 1;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: var(--text-base);
  cursor: text;
  padding: var(--space-1);
  transition: background-color var(--transition-fast);
  margin: 0;
}

.card__title:hover {
  background-color: var(--bg-tertiary);
}

.edit-input {
  flex: 1;
  padding: var(--space-1);
  border: 1px solid var(--border);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.edit-input:focus {
  border-color: var(--accent);
}

.board-card__content {
  padding: var(--space-3);
  flex: 1;
}

.board-stats {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.separator {
  color: var(--border-light);
}

.board-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.board-card__actions {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  padding-top: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.board-card:hover .board-card__actions {
  opacity: 1;
}

.board-card__footer {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--border);
}

.card__line {
  flex: 1;
  height: 1px;
  background: var(--border);
  margin: 0 var(--space-2);
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
}

.btn--md {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.btn--secondary {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.btn--secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  border-color: var(--text-tertiary);
}

.btn--ghost {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.btn--ghost:hover:not(:disabled) {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.btn--danger {
  background-color: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.btn--danger:hover:not(:disabled) {
  background-color: var(--accent-dim);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 1000;
}

.modal {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.modal__corner {
  color: var(--border-light);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.modal__title {
  flex: 1;
  font-size: var(--text-base);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.modal__content {
  padding: var(--space-4);
}

.modal__content p {
  margin: 0 0 var(--space-3) 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.board-name-display {
  font-weight: 500;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  font-family: inherit;
  margin-bottom: var(--space-4) !important;
}

.confirm-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  box-sizing: border-box;
}

.confirm-input::placeholder {
  color: var(--text-tertiary);
}

.confirm-input:focus {
  border-color: var(--accent);
}

.modal__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  padding: var(--space-4);
  padding-top: 0;
}
</style>
