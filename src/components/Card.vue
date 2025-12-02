<template>
  <div class="card">
    <span class="card-title">{{ card.title }}</span>

    <button class="delete-btn" @click.stop="emit('delete-card', card.id)">&times;</button>
  </div>
</template>

<script setup lang="ts">
import type { Card } from "@/types";

const props = defineProps<{
  card: Card;
}>();

const emit = defineEmits<{
  (e: "delete-card", cardId: string): void;
}>();
</script>

<style scoped>
.card {
  background-color: var(--md-surface);
  padding: 8px;
  border-radius: 3px;
  margin-bottom: 8px;
  box-shadow: 0 1px 0 rgba(9, 30, 66, 0.25);
  cursor: pointer;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card:hover {
  background-color: var(--md-surface-variant);
}

.delete-btn {
  opacity: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--md-primary);
  padding: 0 4px;
  border-radius: 3px;
}

.delete-btn:hover {
  background-color: var(--md-on-secondary);
  color: var(--md-secondary);
}

.card:hover .delete-btn {
  opacity: 1;
}

.card-title {
  word-break: break-word; /* Prevents long words from breaking layout */
}
</style>
