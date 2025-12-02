import "./assets/theme.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

import { useBoardStore } from "./stores/boardStore";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const boardStore = useBoardStore();
boardStore.initializeBoard();

app.mount("#app");
