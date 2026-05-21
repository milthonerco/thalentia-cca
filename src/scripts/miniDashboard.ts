import { authStore } from "../lib/authStore";

const logout = document.getElementById("logout");

logout?.addEventListener("click", async () => {
  await authStore.logout();
  window.location.href = "/";
});