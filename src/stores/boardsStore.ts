import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Card, List, Board, BoardMetadata, DbBoard, DbList, DbCard } from "@/types";

export const useBoardsStore = defineStore("boards", () => {
  const boards = ref<Board[]>([]);
  const currentBoardId = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Transform database rows to application types
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

  const getCurrentBoard = computed<Board | null>(() => {
    if (!currentBoardId.value) return null;
    return boards.value.find((b) => b.id === currentBoardId.value) ?? null;
  });

  const getBoardById = (id: string): Board | null => {
    return boards.value.find((b) => b.id === id) ?? null;
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

  const setCurrentBoard = (boardId: string): void => {
    const board = getBoardById(boardId);
    if (board) {
      currentBoardId.value = boardId;
    }
  };

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
