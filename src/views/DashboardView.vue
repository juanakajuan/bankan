<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">
        <span class="prompt">&gt;</span> BANKAN
        <BlinkingCursor />
      </h1>
      <p class="dashboard-subtitle">board management</p>

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
      <button @click="loadBoards" class="btn btn--secondary btn--md">Retry</button>
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
        <div class="create-text">New Board</div>
      </div>
    </div>
  </div>

  <teleport to="body">
    <div v-if="isCreating" class="modal-overlay animate-fade-in" @click="closeCreateModal">
      <div class="modal animate-slide-up" @click.stop>
        <div class="modal__header">
          <span class="modal__corner">+-</span>
          <h2 class="modal__title">Create Board</h2>
          <span class="modal__corner">-+</span>
        </div>

        <div class="modal__content">
          <p>Enter a name for your new board:</p>
          <input
            v-model="newBoardName"
            @keydown.enter="createBoard"
            placeholder="Board name"
            class="board-name-input"
            ref="createInputRef"
          />
        </div>

        <div class="modal__actions">
          <button @click="closeCreateModal" class="btn btn--secondary btn--md">Cancel</button>
          <button
            @click="createBoard"
            class="btn btn--primary btn--md"
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
import BlinkingCursor from "@/components/BlinkingCursor.vue";
import { useBoardsStore } from "@/stores/boardsStore";
import type { BoardMetadata } from "@/types";

const router = useRouter();
const boardsStore = useBoardsStore();

const showArchivedBoards = ref<boolean>(false);
const isCreating = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const newBoardName = ref<string>("");

const createInputRef = useTemplateRef<HTMLInputElement>("createInputRef");

const displayedBoards = computed<BoardMetadata[]>(() => {
  const boards = boardsStore.getAllBoards(showArchivedBoards.value);

  return boards
    .map((board) => boardsStore.getBoardMetadata(board.id))
    .filter((metadata): metadata is BoardMetadata => metadata !== null)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
});

const loadBoards = async (): Promise<void> => {
  await boardsStore.fetchBoards();
};

onMounted(() => {
  loadBoards();
});

const showCreateModal = (): void => {
  isCreating.value = true;
  newBoardName.value = "";

  nextTick(() => {
    createInputRef.value?.focus();
  });
};

const closeCreateModal = (): void => {
  isCreating.value = false;
  newBoardName.value = "";
};

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

const handleDelete = async (boardId: string): Promise<void> => {
  await boardsStore.deleteBoard(boardId);
};

const handleArchive = async (boardId: string): Promise<void> => {
  await boardsStore.archiveBoard(boardId);
};

const handleUnarchive = async (boardId: string): Promise<void> => {
  await boardsStore.unarchiveBoard(boardId);
};

const handleRename = async (boardId: string, newTitle: string): Promise<void> => {
  await boardsStore.updateBoardTitle(boardId, newTitle);
};
</script>

<style scoped>
.dashboard {
  padding: var(--space-6);
  min-height: 100vh;
  box-sizing: border-box;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-4);
}

.dashboard-title {
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: 0.15em;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
}

.prompt {
  color: var(--accent);
}

.dashboard-subtitle {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin: 0;
  padding-left: calc(var(--space-4) + 0.5ch);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.archive-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  user-select: none;
}

.archive-toggle input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

/* Error State */
.error-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--accent);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.error-state p {
  margin: 0;
  font-size: var(--text-base);
}

.create-board-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  opacity: 0.8;
}

.create-board-card:hover {
  border-color: var(--border-light);
  background-color: var(--bg-tertiary);
  opacity: 1;
}

.create-icon {
  font-size: 48px;
  color: var(--accent);
  margin-bottom: var(--space-2);
  font-weight: 300;
}

.create-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.btn--md {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.btn--primary {
  background-color: var(--accent);
  color: var(--bg-primary);
  border: 1px solid var(--accent);
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--accent-hover);
  border-color: var(--accent-hover);
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

.board-name-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  box-sizing: border-box;
}

.board-name-input::placeholder {
  color: var(--text-tertiary);
}

.board-name-input:focus {
  border-color: var(--accent);
}

.modal__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  padding: var(--space-4);
  padding-top: 0;
}

@media (max-width: 768px) {
  .dashboard {
    padding: var(--space-4);
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
