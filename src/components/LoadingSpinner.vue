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
  color: var(--term-green);
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
  animation: spin 0.8s steps(4) infinite;
}

.spinner::before {
  content: "|";
  display: block;
}

.spinner-small {
  font-size: 32px;
}

.spinner-medium {
  font-size: 48px;
}

.spinner-large {
  font-size: 80px;
}

@keyframes spin {
  0% {
    content: "|";
  }
  25% {
    content: "/";
  }
  50% {
    content: "─";
  }
  75% {
    content: "\\";
  }
  100% {
    content: "|";
  }
}

/* Animation needs to be on the ::before pseudo-element */
.spinner::before {
  animation: spin-chars 0.8s steps(4) infinite;
}

@keyframes spin-chars {
  0% {
    content: "|";
  }
  25% {
    content: "/";
  }
  50% {
    content: "─";
  }
  75% {
    content: "\\";
  }
  100% {
    content: "|";
  }
}
</style>
