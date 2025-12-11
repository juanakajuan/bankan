<template>
  <div class="board-card" @click="navigateToBoard">
    <div class="board-card-content">
      <h3 v-if="!isEditing" @click.stop="startEditing" class="board-title">
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

      <div class="board-stats">
        <span>{{ props.board.listCount }} lists • {{ props.board.cardCount }} cards</span>
      </div>

      <div class="board-meta">
        <span class="last-modified">{{ formatDate(props.board.lastModified) }}</span>
      </div>
    </div>

    <div class="board-actions">
      <button
        v-if="!props.board.isArchived"
        class="archive-btn"
        @click.stop="handleArchive"
        title="Archive Board"
      >
        Archive
      </button>
      <button v-else class="unarchive-btn" @click.stop="handleUnarchive" title="Restore Board">
        Restore
      </button>
      <button class="delete-btn" @click.stop="showDeleteModal" title="Delete Board">Delete</button>
    </div>
  </div>

  <teleport to="body">
    <div v-if="isDeleting" class="modal-backdrop" @click="closeDeleteModal">
      <div class="modal" @click.stop>
        <h2>Delete Board?</h2>
        <p>This action cannot be undone. Type the board name to confirm:</p>
        <p class="board-name-display">{{ props.board.title }}</p>
        <input
          v-model="deleteConfirmation"
          @keydown.enter="confirmDelete"
          placeholder="Type board name here"
          class="confirm-input"
          ref="deleteInputRef"
        />
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="cancel-btn">Cancel</button>
          <button @click="confirmDelete" class="confirm-delete-btn" :disabled="!isDeleteConfirmed">
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

/**
 * Computed property that validates if delete confirmation matches board title
 * @returns True if confirmation input matches the board title exactly
 */
const isDeleteConfirmed = computed<boolean>(() => deleteConfirmation.value === props.board.title);

/**
 * Navigates to the board detail view when card is clicked
 * Navigation is prevented when editing or deleting to avoid accidental navigation
 */
const navigateToBoard = (): void => {
  if (!isEditing.value && !isDeleting.value) {
    router.push({ name: "board", params: { id: props.board.id } });
  }
};

/**
 * Initiates title editing mode
 * Sets up editing state and focuses/selects the input field
 */
const startEditing = (): void => {
  editedTitle.value = props.board.title;
  isEditing.value = true;
  shouldSaveOnBlur.value = true;

  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
};

/**
 * Saves the edited title and exits editing mode
 * Only emits rename event if the title is not empty after trimming
 */
const saveEdit = (): void => {
  if (editedTitle.value.trim()) {
    emit("rename", props.board.id, editedTitle.value.trim());
  }

  isEditing.value = false;
};

/**
 * Handles blur event on title input
 * Saves edit only if shouldSaveOnBlur is true (prevents save when ESC is pressed)
 */
const handleBlur = (): void => {
  if (shouldSaveOnBlur.value) {
    saveEdit();
  }
};

/**
 * Cancels title editing and reverts to original title
 * Disables save on blur to prevent handleBlur from saving
 */
const cancelEdit = (): void => {
  shouldSaveOnBlur.value = false;
  editedTitle.value = props.board.title;
  isEditing.value = false;
};

/**
 * Handles board archiving
 * Emits archive event with board ID
 */
const handleArchive = (): void => {
  emit("archive", props.board.id);
};

/**
 * Handles board unarchiving
 * Emits unarchive event with board ID
 */
const handleUnarchive = (): void => {
  emit("unarchive", props.board.id);
};

/**
 * Opens the delete confirmation modal
 * Resets confirmation input and focuses the input field
 */
const showDeleteModal = (): void => {
  isDeleting.value = true;
  deleteConfirmation.value = "";
  nextTick(() => {
    deleteInputRef.value?.focus();
  });
};

/**
 * Closes the delete confirmation modal
 * Resets confirmation input state
 */
const closeDeleteModal = (): void => {
  isDeleting.value = false;
  deleteConfirmation.value = "";
};

/**
 * Confirms and executes board deletion
 * Only proceeds if confirmation input matches board title exactly
 */
const confirmDelete = (): void => {
  if (isDeleteConfirmed.value) {
    emit("delete", props.board.id);
    closeDeleteModal();
  }
};

/**
 * Formats a date string into a human-readable relative time format
 *
 * @param dateString - ISO date string to format
 * @returns Formatted relative time (e.g., "5 mins ago", "2 days ago") or absolute date
 *
 * @example
 * formatDate("2024-01-15T10:30:00Z") // "5 mins ago"
 * formatDate("2024-01-10T10:30:00Z") // "5 days ago"
 * formatDate("2023-12-01T10:30:00Z") // "12/1/2023"
 */
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
  background-color: var(--md-surface);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(156, 141, 139, 0.2);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.24);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;
}

.board-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 6px 20px rgba(0, 0, 0, 0.3);
  border-color: rgba(156, 141, 139, 0.35);
}

.board-card-content {
  flex: 1;
}

.board-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  cursor: text;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.board-title:hover {
  background-color: var(--md-surface-variant);
}

.edit-input {
  width: 100%;
  font-size: 20px;
  font-weight: 600;
  padding: 4px;
  border: none;
  background-color: var(--md-surface);
  color: var(--md-on-background);
  font-family: inherit;
  outline: 2px solid var(--md-primary);
  border-radius: 4px;
  margin-bottom: 12px;
}

.board-stats {
  font-size: 14px;
  color: var(--md-outline);
  margin-bottom: 8px;
}

.board-meta {
  font-size: 12px;
  color: var(--md-outline);
  opacity: 0.8;
}

.board-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.board-card:hover .board-actions {
  opacity: 1;
}

.archive-btn,
.unarchive-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.archive-btn {
  background-color: var(--md-surface-variant);
  color: var(--md-on-background);
}

.archive-btn:hover {
  background-color: var(--md-on-secondary);
}

.unarchive-btn {
  background-color: var(--md-primary);
  color: var(--md-on-primary);
}

.unarchive-btn:hover {
  opacity: 0.9;
}

.delete-btn {
  background-color: var(--md-secondary);
  color: var(--md-on-secondary);
}

.delete-btn:hover {
  opacity: 0.9;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--md-surface);
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.modal h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
}

.modal p {
  margin: 0 0 16px 0;
  color: var(--md-outline);
}

.board-name-display {
  font-weight: 600;
  color: var(--md-on-background);
  background-color: var(--md-surface-variant);
  padding: 8px 12px;
  border-radius: 4px;
  font-family: monospace;
}

.confirm-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--md-outline);
  border-radius: 4px;
  background-color: var(--md-surface-variant);
  color: var(--md-on-background);
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.confirm-input:focus {
  outline: none;
  border-color: var(--md-primary);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-delete-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: var(--md-surface-variant);
  color: var(--md-on-background);
}

.cancel-btn:hover {
  background-color: var(--md-on-secondary);
}

.confirm-delete-btn {
  background-color: var(--md-secondary);
  color: var(--md-on-secondary);
}

.confirm-delete-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.confirm-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
