<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Bankan - Your Boards</h1>
      <div class="header-actions">
        <label class="archive-toggle">
          <input type="checkbox" v-model="showArchivedBoards" />
          <span>Show Archived</span>
        </label>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="boardsStore.loading" class="boards-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
        <div class="skeleton-stats"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="boardsStore.error" class="error-state">
      <p>Failed to load boards: {{ boardsStore.error }}</p>
      <button @click="loadBoards" class="retry-btn">Retry</button>
    </div>

    <!-- Loaded State -->
    <div v-else class="boards-grid">
      <BoardCard
        v-for="board in displayedBoards"
        :key="board.id"
        :board="board"
        @delete="handleDelete"
        @archive="handleArchive"
        @unarchive="handleUnarchive"
        @rename="handleRename"
      />

      <div class="create-board-card" @click="showCreateModal">
        <div class="create-icon">+</div>
        <div class="create-text">Create New Board</div>
      </div>
    </div>
  </div>

  <teleport to="body">
    <div v-if="isCreating" class="modal-backdrop" @click="closeCreateModal">
      <div class="modal" @click.stop>
        <h2>Create New Board</h2>
        <p>Enter a name for your new board:</p>
        <input
          v-model="newBoardName"
          @keydown.enter="createBoard"
          placeholder="Board name"
          class="board-name-input"
          ref="createInputRef"
        />
        <div class="modal-actions">
          <button @click="closeCreateModal" class="cancel-btn">Cancel</button>
          <button
            @click="createBoard"
            class="create-btn"
            :disabled="!newBoardName.trim() || isSubmitting"
          >
            {{ isSubmitting ? "Creating..." : "Create" }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import BoardCard from "@/components/BoardCard.vue";
import { useBoardsStore } from "@/stores/boardsStore";
import type { BoardMetadata } from "@/types";

const router = useRouter();
const boardsStore = useBoardsStore();

const showArchivedBoards = ref<boolean>(false);
const isCreating = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const newBoardName = ref<string>("");

/**
 * Template reference to the board name input element for focus management
 */
const createInputRef = useTemplateRef<HTMLInputElement>("createInputRef");

/**
 * Computed property that filters and sorts boards for display
 *
 * @remarks
 * Retrieves boards from the store based on archive filter, maps them to metadata,
 * filters out any null entries, and sorts by last modified date (newest first).
 *
 * @returns Array of board metadata sorted by modification date
 */
const displayedBoards = computed<BoardMetadata[]>(() => {
  const boards = boardsStore.getAllBoards(showArchivedBoards.value);

  return boards
    .map((board) => boardsStore.getBoardMetadata(board.id))
    .filter((metadata): metadata is BoardMetadata => metadata !== null)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
});

/**
 * Fetches all boards from the store
 *
 * @remarks
 * Triggers the boards store to fetch all boards from the backend.
 * Used on component mount and for retry functionality.
 */
const loadBoards = async (): Promise<void> => {
  await boardsStore.fetchBoards();
};

onMounted(() => {
  loadBoards();
});

/**
 * Opens the create board modal and focuses the input field
 *
 * @remarks
 * Resets the board name input and focuses it after the modal is rendered
 * using nextTick to ensure DOM updates are complete.
 */
const showCreateModal = (): void => {
  isCreating.value = true;
  newBoardName.value = "";

  nextTick(() => {
    createInputRef.value?.focus();
  });
};

/**
 * Closes the create board modal and resets form state
 */
const closeCreateModal = (): void => {
  isCreating.value = false;
  newBoardName.value = "";
};

/**
 * Creates a new board and navigates to it
 *
 * @remarks
 * Validates the board name, prevents duplicate submissions, creates the board
 * via the store, and redirects to the newly created board on success.
 */
const createBoard = async (): Promise<void> => {
  if (newBoardName.value.trim() && !isSubmitting.value) {
    isSubmitting.value = true;
    const boardId = await boardsStore.createBoard(newBoardName.value.trim());
    isSubmitting.value = false;
    closeCreateModal();

    if (boardId) {
      router.push({ name: "board", params: { id: boardId } });
    }
  }
};

/**
 * Handles board deletion
 *
 * @param boardId - The unique identifier of the board to delete
 */
const handleDelete = async (boardId: string): Promise<void> => {
  await boardsStore.deleteBoard(boardId);
};

/**
 * Handles archiving a board
 *
 * @param boardId - The unique identifier of the board to archive
 */
const handleArchive = async (boardId: string): Promise<void> => {
  await boardsStore.archiveBoard(boardId);
};

/**
 * Handles unarchiving a board
 *
 * @param boardId - The unique identifier of the board to unarchive
 */
const handleUnarchive = async (boardId: string): Promise<void> => {
  await boardsStore.unarchiveBoard(boardId);
};

/**
 * Handles renaming a board
 *
 * @param boardId - The unique identifier of the board to rename
 * @param newTitle - The new title to assign to the board
 */
const handleRename = async (boardId: string, newTitle: string): Promise<void> => {
  await boardsStore.updateBoardTitle(boardId, newTitle);
};
</script>

<style scoped>
.dashboard {
  padding: 40px;
  min-height: 100vh;
  box-sizing: border-box;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 32px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.archive-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--md-outline);
  user-select: none;
}

.archive-toggle input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Skeleton Loader Styles */
.skeleton-card {
  background-color: var(--md-surface);
  border-radius: 8px;
  padding: 20px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-title,
.skeleton-meta,
.skeleton-stats {
  background: linear-gradient(
    90deg,
    var(--md-surface-variant) 25%,
    var(--md-on-secondary) 50%,
    var(--md-surface-variant) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 24px;
  width: 70%;
}

.skeleton-meta {
  height: 16px;
  width: 50%;
}

.skeleton-stats {
  height: 16px;
  width: 40%;
  margin-top: auto;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 40px;
  color: var(--md-outline);
}

.error-state p {
  margin-bottom: 16px;
}

.retry-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  background-color: var(--md-primary);
  color: var(--md-on-primary);
  transition: all 0.2s ease;
}

.retry-btn:hover {
  opacity: 0.9;
}

.create-board-card {
  background-color: var(--md-surface);
  border: 2px dashed var(--md-outline);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  opacity: 0.8;
}

.create-board-card:hover {
  border-color: var(--md-primary);
  opacity: 1;
  transform: translateY(-4px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 6px 20px rgba(0, 0, 0, 0.3);
}

.create-icon {
  font-size: 48px;
  color: var(--md-primary);
  margin-bottom: 8px;
  font-weight: 300;
}

.create-text {
  font-size: 16px;
  color: var(--md-on-background);
  font-weight: 500;
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

.board-name-input {
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

.board-name-input:focus {
  outline: none;
  border-color: var(--md-primary);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.create-btn {
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

.create-btn {
  background-color: var(--md-primary);
  color: var(--md-on-primary);
}

.create-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 20px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .boards-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .boards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
