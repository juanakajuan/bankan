<template>
  <span class="blinking-cursor" aria-hidden="true">{{ char }}</span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    char?: string;
  }>(),
  {
    char: "_",
  },
);
</script>

<style scoped>
.blinking-cursor {
  animation: blink 1s step-end infinite;
  color: var(--accent);
  font-weight: 700;
}
</style>
