import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Card, List, Board, BoardMetadata, DbBoard, DbList, DbCard } from "@/types";

/**
 * Pinia store for managing Kanban boards, lists, and cards.
 *
 * @remarks
 * This store provides a comprehensive API for CRUD operations on boards, lists, and cards,
 * including drag-and-drop position management and board archival. All data is persisted
 * to Supabase and synchronized with local state.
 *
 * @example
 * ```ts
 * const boardsStore = useBoardsStore();
 * await boardsStore.fetchBoards();
 * const boardId = await boardsStore.createBoard("My Board");
 * await boardsStore.addList(boardId, "To Do");
 * ```
 */
export const useBoardsStore = defineStore("boards", () => {
  const boards = ref<Board[]>([]);
  const currentBoardId = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * Transforms database board rows into application Board objects.
   *
   * @param dbBoard - Raw board data from database
   * @param dbLists - All lists from database
   * @param dbCards - All cards from database
   * @returns Fully hydrated Board object with nested lists and cards
   *
   * @internal
   */
  const transformBoard = (dbBoard: DbBoard, dbLists: DbList[], dbCards: DbCard[]): Board => {
    const listsForBoard = dbLists
      .filter((l) => l.board_id === dbBoard.id)
      .sort((a, b) => a.position - b.position);

    const lists: List[] = listsForBoard.map((dbList) => {
      const cardsForList = dbCards
        .filter((c) => c.list_id === dbList.id)
        .sort((a, b) => a.position - b.position);

      return {
        id: dbList.id,
        title: dbList.title,
        position: dbList.position,
        cards: cardsForList.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          position: c.position,
        })),
      };
    });

    return {
      id: dbBoard.id,
      title: dbBoard.title,
      lists,
      createdAt: dbBoard.created_at,
      lastModified: dbBoard.updated_at,
      isArchived: dbBoard.is_archived,
    };
  };

  /**
   * Fetches all boards with their lists and cards from the database.
   *
   * @remarks
   * Updates the `boards` state with all boards ordered by last modified date.
   * Sets `loading` and `error` states during the operation.
   *
   * @throws Sets `error` state if database query fails
   */
  const fetchBoards = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const [boardsResult, listsResult, cardsResult] = await Promise.all([
        supabase.from("boards").select("*").order("updated_at", { ascending: false }),
        supabase.from("lists").select("*"),
        supabase.from("cards").select("*"),
      ]);

      if (boardsResult.error) throw boardsResult.error;
      if (listsResult.error) throw listsResult.error;
      if (cardsResult.error) throw cardsResult.error;

      const dbBoards = boardsResult.data ?? [];
      const dbLists = listsResult.data ?? [];
      const dbCards = cardsResult.data ?? [];

      boards.value = dbBoards.map((b) => transformBoard(b, dbLists, dbCards));
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch boards";
      console.error("fetchBoards error:", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetches a single board by ID and updates local state.
   *
   * @param boardId - UUID of the board to fetch
   * @returns The fetched Board object, or null if not found or error occurs
   *
   * @remarks
   * Also updates the board in the `boards` array if it already exists,
   * or adds it if not present.
   */
  const fetchBoardById = async (boardId: string): Promise<Board | null> => {
    try {
      const [boardResult, listsResult, cardsResult] = await Promise.all([
        supabase.from("boards").select("*").eq("id", boardId).single(),
        supabase.from("lists").select("*").eq("board_id", boardId),
        supabase.from("cards").select("*"),
      ]);

      if (boardResult.error) throw boardResult.error;
      if (listsResult.error) throw listsResult.error;
      if (cardsResult.error) throw cardsResult.error;

      const dbBoard = boardResult.data;
      const dbLists = listsResult.data ?? [];
      const listIds = dbLists.map((l) => l.id);
      const dbCards = (cardsResult.data ?? []).filter((c) => listIds.includes(c.list_id));

      const board = transformBoard(dbBoard, dbLists, dbCards);

      // Update local state
      const index = boards.value.findIndex((b) => b.id === boardId);
      if (index >= 0) {
        boards.value[index] = board;
      } else {
        boards.value.push(board);
      }

      return board;
    } catch (err) {
      console.error("fetchBoardById error:", err);
      return null;
    }
  };

  /**
   * Computed property that returns the currently active board.
   *
   * @returns The current Board object, or null if no board is active
   */
  const getCurrentBoard = computed<Board | null>(() => {
    if (!currentBoardId.value) return null;
    return boards.value.find((b) => b.id === currentBoardId.value) ?? null;
  });

  /**
   * Gets a board from local state by ID.
   *
   * @param id - UUID of the board
   * @returns The Board object, or null if not found
   */
  const getBoardById = (id: string): Board | null => {
    return boards.value.find((b) => b.id === id) ?? null;
  };

  /**
   * Gets all boards from local state.
   *
   * @param includeArchived - Whether to include archived boards (default: false)
   * @returns Array of Board objects
   */
  const getAllBoards = (includeArchived = false): Board[] => {
    if (includeArchived) {
      return boards.value;
    }
    return boards.value.filter((b) => !b.isArchived);
  };

  /**
   * Gets summary metadata for a board.
   *
   * @param id - UUID of the board
   * @returns BoardMetadata object with list/card counts, or null if board not found
   */
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

  /**
   * Creates a new board in the database.
   *
   * @param title - Title for the new board
   * @returns UUID of the created board, or null if creation fails
   *
   * @remarks
   * The new board is added to the beginning of the `boards` array.
   */
  const createBoard = async (title: string): Promise<string | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from("boards")
        .insert({ title })
        .select()
        .single();

      if (insertError) throw insertError;

      const newBoard: Board = {
        id: data.id,
        title: data.title,
        lists: [],
        createdAt: data.created_at,
        lastModified: data.updated_at,
        isArchived: data.is_archived,
      };

      boards.value.unshift(newBoard);
      return data.id;
    } catch (err) {
      console.error("createBoard error:", err);
      return null;
    }
  };

  /**
   * Updates a board's title.
   *
   * @param boardId - UUID of the board to update
   * @param newTitle - New title for the board
   *
   * @remarks
   * Also updates the board's `lastModified` timestamp.
   */
  const updateBoardTitle = async (boardId: string, newTitle: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from("boards")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", boardId);

      if (updateError) throw updateError;

      const board = getBoardById(boardId);
      if (board) {
        board.title = newTitle;
        board.lastModified = new Date().toISOString();
      }
    } catch (err) {
      console.error("updateBoardTitle error:", err);
    }
  };

  /**
   * Permanently deletes a board from the database.
   *
   * @param boardId - UUID of the board to delete
   *
   * @remarks
   * Removes the board from local state and clears `currentBoardId` if it matches.
   * This operation cascades to delete all associated lists and cards.
   */
  const deleteBoard = async (boardId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase.from("boards").delete().eq("id", boardId);

      if (deleteError) throw deleteError;

      boards.value = boards.value.filter((b) => b.id !== boardId);
      if (currentBoardId.value === boardId) {
        currentBoardId.value = null;
      }
    } catch (err) {
      console.error("deleteBoard error:", err);
    }
  };

  /**
   * Archives a board without deleting it.
   *
   * @param boardId - UUID of the board to archive
   *
   * @remarks
   * Archived boards are excluded from `getAllBoards()` by default.
   * Updates the board's `lastModified` timestamp.
   */
  const archiveBoard = async (boardId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from("boards")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", boardId);

      if (updateError) throw updateError;

      const board = getBoardById(boardId);
      if (board) {
        board.isArchived = true;
        board.lastModified = new Date().toISOString();
      }
    } catch (err) {
      console.error("archiveBoard error:", err);
    }
  };

  /**
   * Unarchives a previously archived board.
   *
   * @param boardId - UUID of the board to unarchive
   *
   * @remarks
   * Updates the board's `lastModified` timestamp.
   */
  const unarchiveBoard = async (boardId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from("boards")
        .update({ is_archived: false, updated_at: new Date().toISOString() })
        .eq("id", boardId);

      if (updateError) throw updateError;

      const board = getBoardById(boardId);
      if (board) {
        board.isArchived = false;
        board.lastModified = new Date().toISOString();
      }
    } catch (err) {
      console.error("unarchiveBoard error:", err);
    }
  };

  /**
   * Sets the currently active board.
   *
   * @param boardId - UUID of the board to set as current
   *
   * @remarks
   * Only sets the board if it exists in local state.
   */
  const setCurrentBoard = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      currentBoardId.value = boardId;
    }
  };

  /**
   * Adds a new list to a board.
   *
   * @param boardId - UUID of the parent board
   * @param title - Title for the new list
   *
   * @remarks
   * The list is positioned at the end of the board.
   * Updates the board's `lastModified` timestamp.
   */
  const addList = async (boardId: string, title: string): Promise<void> => {
    try {
      const board = getBoardById(boardId);
      const maxPosition = board ? Math.max(-1, ...board.lists.map((l) => l.position)) + 1 : 0;

      const { data, error: insertError } = await supabase
        .from("lists")
        .insert({ board_id: boardId, title, position: maxPosition })
        .select()
        .single();

      if (insertError) throw insertError;

      if (board) {
        board.lists.push({
          id: data.id,
          title: data.title,
          position: data.position,
          cards: [],
        });
        board.lastModified = new Date().toISOString();
      }

      // Update board's updated_at
      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("addList error:", err);
    }
  };

  /**
   * Updates a list's title.
   *
   * @param boardId - UUID of the parent board
   * @param listId - UUID of the list to update
   * @param newTitle - New title for the list
   *
   * @remarks
   * Updates the board's `lastModified` timestamp.
   */
  const updateList = async (boardId: string, listId: string, newTitle: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from("lists")
        .update({ title: newTitle })
        .eq("id", listId);

      if (updateError) throw updateError;

      const board = getBoardById(boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          list.title = newTitle;
        }
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("updateList error:", err);
    }
  };

  /**
   * Deletes a list from a board.
   *
   * @param boardId - UUID of the parent board
   * @param listId - UUID of the list to delete
   *
   * @remarks
   * This operation cascades to delete all cards in the list.
   * Updates the board's `lastModified` timestamp.
   */
  const deleteList = async (boardId: string, listId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase.from("lists").delete().eq("id", listId);

      if (deleteError) throw deleteError;

      const board = getBoardById(boardId);
      if (board) {
        board.lists = board.lists.filter((list) => list.id !== listId);
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("deleteList error:", err);
    }
  };

  /**
   * Adds a new card to a list.
   *
   * @param boardId - UUID of the parent board
   * @param listId - UUID of the parent list
   * @param cardTitle - Title for the new card
   *
   * @remarks
   * The card is positioned at the end of the list.
   * Updates the board's `lastModified` timestamp.
   */
  const addCard = async (boardId: string, listId: string, cardTitle: string): Promise<void> => {
    try {
      const board = getBoardById(boardId);
      const list = board?.lists.find((l) => l.id === listId);
      const maxPosition = list ? Math.max(-1, ...list.cards.map((c) => c.position)) + 1 : 0;

      const { data, error: insertError } = await supabase
        .from("cards")
        .insert({ list_id: listId, title: cardTitle, position: maxPosition })
        .select()
        .single();

      if (insertError) throw insertError;

      if (list) {
        list.cards.push({
          id: data.id,
          title: data.title,
          description: data.description,
          position: data.position,
        });
      }

      if (board) {
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("addCard error:", err);
    }
  };

  /**
   * Updates a card's title.
   *
   * @param boardId - UUID of the parent board
   * @param listId - UUID of the parent list
   * @param cardId - UUID of the card to update
   * @param newTitle - New title for the card
   *
   * @remarks
   * Updates the board's `lastModified` timestamp.
   */
  const updateCard = async (
    boardId: string,
    listId: string,
    cardId: string,
    newTitle: string,
  ): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from("cards")
        .update({ title: newTitle })
        .eq("id", cardId);

      if (updateError) throw updateError;

      const board = getBoardById(boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          const card = list.cards.find((c) => c.id === cardId);
          if (card) {
            card.title = newTitle;
          }
        }
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("updateCard error:", err);
    }
  };

  /**
   * Deletes a card from a list.
   *
   * @param boardId - UUID of the parent board
   * @param listId - UUID of the parent list
   * @param cardId - UUID of the card to delete
   *
   * @remarks
   * Updates the board's `lastModified` timestamp.
   */
  const deleteCard = async (boardId: string, listId: string, cardId: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase.from("cards").delete().eq("id", cardId);

      if (deleteError) throw deleteError;

      const board = getBoardById(boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          list.cards = list.cards.filter((card) => card.id !== cardId);
        }
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("deleteCard error:", err);
    }
  };

  /**
   * Updates the positions of lists after drag-and-drop reordering.
   *
   * @param boardId - UUID of the parent board
   * @param lists - Array of lists in their new order
   *
   * @remarks
   * Position indices are recalculated based on array order (0, 1, 2, ...).
   * Updates the board's `lastModified` timestamp.
   */
  const updateListPositions = async (boardId: string, lists: List[]): Promise<void> => {
    try {
      const updates = lists.map((list, index) => ({
        id: list.id,
        board_id: boardId,
        title: list.title,
        position: index,
      }));

      const { error: upsertError } = await supabase.from("lists").upsert(updates);

      if (upsertError) throw upsertError;

      const board = getBoardById(boardId);
      if (board) {
        board.lists = lists.map((list, index) => ({ ...list, position: index }));
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("updateListPositions error:", err);
    }
  };

  /**
   * Updates the positions of cards within a list after drag-and-drop reordering.
   *
   * @param boardId - UUID of the parent board
   * @param listId - UUID of the parent list
   * @param cards - Array of cards in their new order
   *
   * @remarks
   * Position indices are recalculated based on array order (0, 1, 2, ...).
   * Updates the board's `lastModified` timestamp.
   */
  const updateCardPositions = async (
    boardId: string,
    listId: string,
    cards: Card[],
  ): Promise<void> => {
    try {
      const updates = cards.map((card, index) => ({
        id: card.id,
        list_id: listId,
        title: card.title,
        description: card.description,
        position: index,
      }));

      const { error: upsertError } = await supabase.from("cards").upsert(updates);

      if (upsertError) throw upsertError;

      const board = getBoardById(boardId);
      if (board) {
        const list = board.lists.find((l) => l.id === listId);
        if (list) {
          list.cards = cards.map((card, index) => ({ ...card, position: index }));
        }
        board.lastModified = new Date().toISOString();
      }

      await supabase
        .from("boards")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", boardId);
    } catch (err) {
      console.error("updateCardPositions error:", err);
    }
  };

  /**
   * Moves a card from one list to another.
   *
   * @param boardId - UUID of the parent board
   * @param _fromListId - UUID of the source list (unused, kept for API consistency)
   * @param toListId - UUID of the destination list
   * @param cardId - UUID of the card to move
   * @param newPosition - New position index in the destination list
   *
   * @remarks
   * Refetches the entire board to ensure positions are synchronized.
   */
  const moveCard = async (
    boardId: string,
    _fromListId: string,
    toListId: string,
    cardId: string,
    newPosition: number,
  ): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from("cards")
        .update({ list_id: toListId, position: newPosition })
        .eq("id", cardId);

      if (updateError) throw updateError;

      // Refetch board to get updated positions
      await fetchBoardById(boardId);
    } catch (err) {
      console.error("moveCard error:", err);
    }
  };

  return {
    boards,
    currentBoardId,
    loading,
    error,
    getCurrentBoard,
    getBoardById,
    getAllBoards,
    getBoardMetadata,
    fetchBoards,
    fetchBoardById,
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
    updateListPositions,
    updateCardPositions,
    moveCard,
  };
});
