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
    <LoadingSpinner v-if="boardsStore.loading" />

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
import LoadingSpinner from "@/components/LoadingSpinner.vue";
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
  border: 1px solid var(--term-green);
  margin: 10px;
  position: relative;
}

.dashboard::before {
  content: "[ BANKAN TERMINAL v1.0 ]";
  position: absolute;
  top: -12px;
  left: 20px;
  background: var(--md-background);
  padding: 0 10px;
  font-size: 12px;
  color: var(--term-green);
  letter-spacing: 2px;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--term-green);
  padding-bottom: 20px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.dashboard-header h1::before {
  content: "> ";
  color: var(--term-green);
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

.archive-toggle::before {
  content: "[";
}

.archive-toggle::after {
  content: "]";
}

.archive-toggle input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--term-green);
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 40px;
  color: var(--md-error);
  border: 1px solid var(--md-error);
}

.error-state::before {
  content: "! ERROR !";
  display: block;
  font-size: 18px;
  margin-bottom: 16px;
  animation: terminal-blink 0.5s step-end infinite;
}

.error-state p {
  margin-bottom: 16px;
}

.retry-btn {
  padding: 10px 20px;
  border: 1px solid var(--term-green);
  background-color: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--term-green);
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.retry-btn::before {
  content: "[ ";
}

.retry-btn::after {
  content: " ]";
}

.retry-btn:hover {
  background-color: var(--term-green);
  color: var(--md-background);
  box-shadow: var(--term-glow);
}

.create-board-card {
  background-color: var(--md-surface);
  border: 1px dashed var(--term-green);
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
  border-style: solid;
  opacity: 1;
  box-shadow: var(--term-glow);
}

.create-icon {
  font-size: 48px;
  color: var(--term-green);
  margin-bottom: 8px;
  font-weight: 300;
}

.create-text {
  font-size: 14px;
  color: var(--md-on-background);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.create-text::before {
  content: "[ ";
}

.create-text::after {
  content: " ]";
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--md-background);
  border: 1px solid var(--term-green);
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--term-glow-strong);
  position: relative;
}

.modal::before {
  content: "[ NEW BOARD ]";
  position: absolute;
  top: -12px;
  left: 20px;
  background: var(--md-background);
  padding: 0 10px;
  font-size: 12px;
  color: var(--term-green);
  letter-spacing: 2px;
}

.modal h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.modal h2::before {
  content: "> ";
}

.modal p {
  margin: 0 0 16px 0;
  color: var(--md-outline);
}

.board-name-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--term-green);
  background-color: var(--md-surface);
  color: var(--md-on-background);
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.board-name-input::placeholder {
  color: var(--md-outline);
}

.board-name-input:focus {
  outline: none;
  box-shadow: var(--term-glow);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.create-btn {
  padding: 10px 20px;
  border: 1px solid var(--term-green);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.cancel-btn {
  background-color: transparent;
  color: var(--md-on-background);
}

.cancel-btn:hover {
  background-color: var(--md-surface-variant);
}

.create-btn {
  background-color: var(--term-green);
  color: var(--md-background);
}

.create-btn:hover:not(:disabled) {
  box-shadow: var(--term-glow);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 20px;
    margin: 5px;
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
