import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";


/** Botón para alternar entre modo claro y oscuro */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] flex items-center justify-center text-gray-600 dark:text-[#e5e5e5]"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-45" />
      )}
    </button>
  );
};

export default ThemeToggle;
