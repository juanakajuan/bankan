<template>
  <div class="spinner-container">
    <div class="spinner" :class="sizeClass"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  size?: "small" | "medium" | "large";
}

const props = withDefaults(defineProps<Props>(), {
  size: "medium",
});

const sizeClass = computed<string>(() => `spinner-${props.size}`);
</script>

<style scoped>
.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border-width: 2px;
}

.spinner-medium {
  width: 48px;
  height: 48px;
  border-width: 3px;
}

.spinner-large {
  width: 80px;
  height: 80px;
  border-width: 4px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
