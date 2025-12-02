<template>
  <div class="card">
    {{ card.title }}
  </div>
</template>

<script setup lang="ts">
import type { Card } from "@/types";

defineProps<{
  card: Card;
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
  font-size: 14px;
  color: var(--md-on-background);
}

.card:hover {
  background-color: var(--md-surface-variant);
}
</style>
