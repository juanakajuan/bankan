import "./assets/theme.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

import { useBoardsStore } from "./stores/boardsStore";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const boardsStore = useBoardsStore();
boardsStore.initializeBoards();

app.mount("#app");
