import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import DashboardView from "@/views/DashboardView.vue";
import BoardView from "@/views/BoardView.vue";
import { useBoardsStore } from "@/stores/boardsStore";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "dashboard",
    component: DashboardView,
  },
  {
    path: "/board/:id",
    name: "board",
    component: BoardView,
    beforeEnter: (to, _from, next) => {
      const boardsStore = useBoardsStore();
      const boardId = to.params.id as string;
      const board = boardsStore.getBoardById(boardId);

      if (board) {
        boardsStore.setCurrentBoard(boardId);
        next();
      } else {
        next({ name: "dashboard" });
      }
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
