<template>
  <div class="list-container">
    <h3>{{ props.list.title }}</h3>

    <div class="card-area"></div>

    <div class="add-card-input">
      <input v-model="newCardTitle" @keyup.enter="handleAddCard" placeholder="+ Add a card" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Card, List } from "@/types";

const props = defineProps<{
  list: List;
}>();

const newCardTitle = ref<string>("");

const handleAddCard = () => {
  // TODO: Add pinia logic here in the future
  alert(`Attempting to add card "${newCardTitle.value}" to list "${props.list.title}"`);
  newCardTitle.value = "";
};
</script>

<style scoped>
.list-container {
  flex-shrink: 0;
  width: 272px;
  background-color: var(--md-surface);
  border-radius: 3px;
  padding: 8px;
}

.h3 {
  font-size: 16px;
  margin: 0 0 8px 0;
  padding: 0 8px;
}
</style>
