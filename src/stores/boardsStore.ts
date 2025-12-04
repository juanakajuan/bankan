import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Card, List, Board, BoardMetadata, ImportResult } from "@/types";

export const useBoardsStore = defineStore("boards", () => {
  const boards = ref<Board[]>([]);
  const currentBoardId = ref<string | null>(null);

  const saveBoards = (): void => {
    localStorage.setItem("bankan-boards", JSON.stringify(boards.value));
    if (currentBoardId.value) {
      localStorage.setItem("bankan-active-board-id", currentBoardId.value);
    }
  };

  const migrateFromOldFormat = (): void => {
    const oldData = localStorage.getItem("bankan-board-data");
    if (oldData) {
      try {
        const oldBoard = JSON.parse(oldData) as {
          id: string;
          title: string;
          lists: List[];
        };

        const migratedBoard: Board = {
          id: oldBoard.id,
          title: oldBoard.title,
          lists: oldBoard.lists,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isArchived: false,
        };

        boards.value.push(migratedBoard);
        currentBoardId.value = migratedBoard.id;

        saveBoards();
        localStorage.removeItem("bankan-board-data");
      } catch (error) {
        console.error("Migration failed:", error);
      }
    }
  };

  const createDefaultBoard = (): string => {
    const defaultBoard: Board = {
      id: `board-${Date.now()}`,
      title: "My First Board",
      lists: [
        {
          id: "list-backlog",
          title: "Backlog",
          cards: [],
        },
        {
          id: "list-in-progress",
          title: "In Progress",
          cards: [],
        },
        {
          id: "list-done",
          title: "Done",
          cards: [],
        },
      ],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isArchived: false,
    };

    boards.value.push(defaultBoard);
    currentBoardId.value = defaultBoard.id;
    saveBoards();

    return defaultBoard.id;
  };

  const initializeBoards = (): void => {
    const savedBoards = localStorage.getItem("bankan-boards");
    const savedActiveId = localStorage.getItem("bankan-active-board-id");

    if (savedBoards) {
      boards.value = JSON.parse(savedBoards) as Board[];
      currentBoardId.value = savedActiveId;
    } else {
      migrateFromOldFormat();
    }

    if (boards.value.length === 0) {
      createDefaultBoard();
    }
  };

  const getCurrentBoard = computed<Board | null>(() => {
    if (!currentBoardId.value) return null;
    return boards.value.find((b) => b.id === currentBoardId.value) || null;
  });

  const getBoardById = (id: string): Board | null => {
    return boards.value.find((b) => b.id === id) || null;
  };

  const getAllBoards = (includeArchived = false): Board[] => {
    if (includeArchived) {
      return boards.value;
    }
    return boards.value.filter((b) => !b.isArchived);
  };

  const getBoardMetadata = (id: string): BoardMetadata | null => {
    const board = getBoardById(id);
    if (!board) return null;

    const listCount = board.lists.length;
    const cardCount = board.lists.reduce((sum, list) => sum + list.cards.length, 0);

    return {
      id: board.id,
      title: board.title,
      createdAt: board.createdAt,
      lastModified: board.lastModified,
      isArchived: board.isArchived,
      listCount,
      cardCount,
    };
  };

  const createBoard = (title: string): string => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: title,
      lists: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isArchived: false,
    };

    boards.value.push(newBoard);
    saveBoards();

    return newBoard.id;
  };

  const updateBoardTitle = (boardId: string, newTitle: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      board.title = newTitle;
      board.lastModified = new Date().toISOString();
      saveBoards();
    }
  };

  const deleteBoard = (boardId: string): void => {
    boards.value = boards.value.filter((b) => b.id !== boardId);
    if (currentBoardId.value === boardId) {
      currentBoardId.value = null;
    }
    saveBoards();
  };

  const archiveBoard = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      board.isArchived = true;
      board.lastModified = new Date().toISOString();
      saveBoards();
    }
  };

  const unarchiveBoard = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      board.isArchived = false;
      board.lastModified = new Date().toISOString();
      saveBoards();
    }
  };

  const setCurrentBoard = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      currentBoardId.value = boardId;
      localStorage.setItem("bankan-active-board-id", boardId);
    }
  };

  const addList = (boardId: string, title: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      const newList: List = {
        id: `list-${Date.now()}`,
        title: title,
        cards: [],
      };

      board.lists.push(newList);
      board.lastModified = new Date().toISOString();
      saveBoards();
    }
  };

  const updateList = (boardId: string, listId: string, newTitle: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      const list = board.lists.find((l) => l.id === listId);
      if (list) {
        list.title = newTitle;
        board.lastModified = new Date().toISOString();
        saveBoards();
      }
    }
  };

  const deleteList = (boardId: string, listId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      board.lists = board.lists.filter((list) => list.id !== listId);
      board.lastModified = new Date().toISOString();
      saveBoards();
    }
  };

  const addCard = (boardId: string, listId: string, cardTitle: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      const list = board.lists.find((l) => l.id === listId);
      if (list) {
        const newCard: Card = {
          id: `card-${Date.now()}`,
          title: cardTitle,
          description: "",
        };

        list.cards.push(newCard);
        board.lastModified = new Date().toISOString();
        saveBoards();
      }
    }
  };

  const updateCard = (boardId: string, listId: string, cardId: string, newTitle: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      const list = board.lists.find((l) => l.id === listId);
      if (list) {
        const card = list.cards.find((c) => c.id === cardId);
        if (card) {
          card.title = newTitle;
          board.lastModified = new Date().toISOString();
          saveBoards();
        }
      }
    }
  };

  const deleteCard = (boardId: string, listId: string, cardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      const list = board.lists.find((l) => l.id === listId);
      if (list) {
        list.cards = list.cards.filter((card) => card.id !== cardId);
        board.lastModified = new Date().toISOString();
        saveBoards();
      }
    }
  };

  const updateBoardLastModified = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      board.lastModified = new Date().toISOString();
      saveBoards();
    }
  };

  const generateNewIds = (board: Board): Board => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    return {
      ...board,
      id: `board-${timestamp}-${random}`,
      lists: board.lists.map((list, listIndex) => ({
        ...list,
        id: `list-${timestamp}-${random}-${listIndex}`,
        cards: list.cards.map((card, cardIndex) => ({
          ...card,
          id: `card-${timestamp}-${random}-${listIndex}-${cardIndex}`,
        })),
      })),
    };
  };

  const validateBoard = (data: any): { valid: boolean; board?: Board; error?: string } => {
    if (!data || typeof data !== "object") {
      return { valid: false, error: "Invalid board data: not an object" };
    }

    if (!data.title || typeof data.title !== "string") {
      return { valid: false, error: "Missing or invalid board title" };
    }

    if (!Array.isArray(data.lists)) {
      return { valid: false, error: "Missing or invalid lists array" };
    }

    const validLists: List[] = [];
    for (const list of data.lists) {
      if (!list || typeof list !== "object") continue;
      if (!list.title || typeof list.title !== "string") continue;

      const cards: Card[] = [];
      if (Array.isArray(list.cards)) {
        for (const card of list.cards) {
          if (!card || typeof card !== "object") continue;
          if (!card.title || typeof card.title !== "string") continue;

          cards.push({
            id: card.id || `temp-${Date.now()}`,
            title: card.title,
            description: card.description || "",
          });
        }
      }

      validLists.push({
        id: list.id || `temp-${Date.now()}`,
        title: list.title,
        cards,
      });
    }

    const board: Board = {
      id: data.id || `temp-${Date.now()}`,
      title: data.title,
      lists: validLists,
      createdAt: data.createdAt || new Date().toISOString(),
      lastModified: data.lastModified || new Date().toISOString(),
      isArchived: data.isArchived === true,
    };

    return { valid: true, board };
  };

  const exportBoard = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (!board) return;

    const jsonData = JSON.stringify(board, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const sanitizedTitle = board.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

    const date = new Date().toISOString().split("T")[0];
    const filename = `bankan-${sanitizedTitle}-${date}.json`;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const exportAllBoards = (): void => {
    const jsonData = JSON.stringify(boards.value, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filename = `bankan-all-boards-${date}.json`;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const importBoards = (fileContent: string): ImportResult => {
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    try {
      const parsed = JSON.parse(fileContent);

      const boardsToImport: any[] = Array.isArray(parsed) ? parsed : [parsed];

      for (let i = 0; i < boardsToImport.length; i++) {
        const boardData = boardsToImport[i];
        const validation = validateBoard(boardData);

        if (validation.valid && validation.board) {
          const boardWithNewIds = generateNewIds(validation.board);
          boardWithNewIds.lastModified = new Date().toISOString();

          boards.value.push(boardWithNewIds);
          result.imported++;
        } else {
          result.skipped++;
          result.errors.push(`Board ${i + 1}: ${validation.error || "Invalid structure"}`);
        }
      }

      if (result.imported > 0) {
        saveBoards();
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Failed to parse JSON file");
    }

    return result;
  };

  return {
    boards,
    currentBoardId,
    getCurrentBoard,
    getBoardById,
    getAllBoards,
    getBoardMetadata,
    initializeBoards,
    createBoard,
    updateBoardTitle,
    deleteBoard,
    archiveBoard,
    unarchiveBoard,
    setCurrentBoard,
    addList,
    updateList,
    deleteList,
    addCard,
    updateCard,
    deleteCard,
    saveBoards,
    updateBoardLastModified,
    exportBoard,
    exportAllBoards,
    importBoards,
  };
});
