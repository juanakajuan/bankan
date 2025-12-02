import { ref } from "vue";
import { defineStore } from "pinia";
import type { Card, List, Board } from "@/types";

export const useBoardStore = defineStore("board", () => {
  const boardData = ref<Board>({
    id: "board-1",
    title: "Bankan Board",
    lists: [],
  });

  const saveBoard = (): void => {
    localStorage.setItem("bankan-board-data", JSON.stringify(boardData.value));
  };

  const initializeBoard = (): void => {
    const savedData = localStorage.getItem("bankan-board-data");
    if (savedData) {
      boardData.value = JSON.parse(savedData) as Board;
    } else {
      saveBoard();
    }
  };

  const addList = (title: string): void => {
    const newList: List = {
      id: `list-${Date.now()}`,
      title: title,
      cards: [],
    };

    boardData.value.lists.push(newList);
    saveBoard();
  };

  const addCard = (listId: string, cardTitle: string): void => {
    const list = boardData.value.lists.find((l) => l.id === listId);

    if (list) {
      const newCard: Card = {
        id: `card-${Date.now()}`,
        title: cardTitle,
        description: "",
      };

      list.cards.push(newCard);
      saveBoard();
    }
  };

  return {
    boardData,
    saveBoard,
    initializeBoard,
    addList,
    addCard,
  };
});
