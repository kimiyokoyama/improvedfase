import { getThemeIconData, setupTheme, toggleTheme } from "./modules/theme.js";

function main() {
  setupTheme();
  document.getElementById("theme-icon-path").setAttribute("d", getThemeIconData());

  // --- theme events ---
  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleTheme();
    document.getElementById("theme-icon-path").setAttribute("d", getThemeIconData());
  });
}

main();
