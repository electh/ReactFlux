import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    showUpdatePrompt();
  },
});

function showUpdatePrompt() {
  if (confirm("A new version is ready, do you want to update?")) {
    updateSW();
  }
}
