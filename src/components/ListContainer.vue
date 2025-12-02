<template>
  <div class="list-container">
    <h3>{{ props.list.title }}</h3>

    <div class="card-area">
      <Card
        v-for="card in props.list.cards"
        :key="card.id"
        :card="card"
        @delete-card="boardStore.deleteCard(props.list.id, $event)"
      />
    </div>

    <div class="add-card-input">
      <input v-model="newCardTitle" @keyup.enter="handleAddCard" placeholder="+ Add a card" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { List } from "@/types";
import { useBoardStore } from "@/stores/boardStore";
import Card from "./Card.vue";

const props = defineProps<{
  list: List;
}>();

const boardStore = useBoardStore();

const newCardTitle = ref<string>("");

const handleAddCard = () => {
  if (newCardTitle.value.trim()) {
    boardStore.addCard(props.list.id, newCardTitle.value.trim());
    newCardTitle.value = "";
  }
};
</script>

<style scoped>
.list-container {
  flex-shrink: 0;
  width: 272px;
  background-color: var(--md-surface);
  border-radius: 3px;
  padding: 8px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.card-area {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 8px;
}

.h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
  padding: 0 4px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 3px;
  border: none;
}
</style>
