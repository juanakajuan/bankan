<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Bankan - Your Boards</h1>
      <div class="header-actions">
        <label class="archive-toggle">
          <input type="checkbox" v-model="showArchived" />
          <span>Show Archived</span>
        </label>
        <button class="import-btn" @click="triggerImport">↓ Import Boards</button>
        <button class="export-all-btn" @click="handleExportAll">↑ Export All</button>
      </div>
    </div>

    <input
      type="file"
      ref="fileInputRef"
      accept=".json"
      @change="handleFileSelected"
      style="display: none"
    />

    <div class="boards-grid">
      <BoardCard
        v-for="board in displayedBoards"
        :key="board.id"
        :board="board"
        @delete="handleDelete"
        @archive="handleArchive"
        @unarchive="handleUnarchive"
        @rename="handleRename"
        @export="handleExport"
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
          <button @click="createBoard" class="create-btn" :disabled="!newBoardName.trim()">
            Create
          </button>
        </div>
      </div>
    </div>

    <div v-if="showImportResult" class="modal-backdrop" @click="closeImportResult">
      <div class="modal" @click.stop>
        <h2>Import Results</h2>

        <div v-if="importResult">
          <div v-if="importResult.imported > 0" class="result-success">
            ✓ Successfully imported {{ importResult.imported }} board{{
              importResult.imported !== 1 ? "s" : ""
            }}
          </div>

          <div v-if="importResult.skipped > 0" class="result-warning">
            ⚠ Skipped {{ importResult.skipped }} board{{ importResult.skipped !== 1 ? "s" : "" }}
          </div>

          <div v-if="importResult.errors.length > 0" class="result-errors">
            <p><strong>Errors:</strong></p>
            <ul>
              <li v-for="(error, idx) in importResult.errors" :key="idx">
                {{ error }}
              </li>
            </ul>
          </div>

          <div
            v-if="importResult.imported === 0 && importResult.skipped === 0"
            class="result-empty"
          >
            No valid boards found in file
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeImportResult" class="ok-btn">OK</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import BoardCard from "@/components/BoardCard.vue";
import { useBoardsStore } from "@/stores/boardsStore";
import type { BoardMetadata, ImportResult } from "@/types";

const router = useRouter();
const boardsStore = useBoardsStore();

const showArchived = ref<boolean>(false);
const isCreating = ref<boolean>(false);
const newBoardName = ref<string>("");
const createInputRef = useTemplateRef<HTMLInputElement>("createInputRef");
const fileInputRef = useTemplateRef<HTMLInputElement>("fileInputRef");
const importResult = ref<ImportResult | null>(null);
const showImportResult = ref<boolean>(false);

const displayedBoards = computed<BoardMetadata[]>(() => {
  const boards = boardsStore.getAllBoards(showArchived.value);
  return boards
    .map((board) => boardsStore.getBoardMetadata(board.id))
    .filter((metadata): metadata is BoardMetadata => metadata !== null)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
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

const createBoard = (): void => {
  if (newBoardName.value.trim()) {
    const boardId = boardsStore.createBoard(newBoardName.value.trim());
    closeCreateModal();
    router.push({ name: "board", params: { id: boardId } });
  }
};

const handleDelete = (boardId: string): void => {
  boardsStore.deleteBoard(boardId);
};

const handleArchive = (boardId: string): void => {
  boardsStore.archiveBoard(boardId);
};

const handleUnarchive = (boardId: string): void => {
  boardsStore.unarchiveBoard(boardId);
};

const handleRename = (boardId: string, newTitle: string): void => {
  boardsStore.updateBoardTitle(boardId, newTitle);
};

const handleExport = (boardId: string): void => {
  boardsStore.exportBoard(boardId);
};

const triggerImport = (): void => {
  fileInputRef.value?.click();
};

const handleFileSelected = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const content = await file.text();
    const result = boardsStore.importBoards(content);

    importResult.value = result;
    showImportResult.value = true;
  } catch (error) {
    importResult.value = {
      imported: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : "Failed to read file"],
    };
    showImportResult.value = true;
  }

  target.value = "";
};

const closeImportResult = (): void => {
  showImportResult.value = false;
  importResult.value = null;
};

const handleExportAll = (): void => {
  boardsStore.exportAllBoards();
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

.import-btn,
.export-all-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.import-btn {
  background-color: var(--md-primary);
  color: var(--md-on-primary);
}

.import-btn:hover {
  opacity: 0.9;
}

.export-all-btn {
  background-color: var(--md-surface-variant);
  color: var(--md-on-background);
}

.export-all-btn:hover {
  background-color: var(--md-on-secondary);
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
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

.result-success {
  color: #4caf50;
  padding: 12px;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
}

.result-warning {
  color: #ff9800;
  padding: 12px;
  background-color: rgba(255, 152, 0, 0.1);
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
}

.result-errors {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--md-surface-variant);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.result-errors ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--md-outline);
}

.result-errors li {
  margin-bottom: 4px;
}

.result-empty {
  color: var(--md-outline);
  padding: 12px;
  text-align: center;
  font-style: italic;
}

.ok-btn {
  padding: 10px 24px;
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

.ok-btn:hover {
  opacity: 0.9;
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

  .import-btn,
  .export-all-btn {
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
