import React from "react";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { Link } from "react-router-dom";
const Breadcrumbs = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 dark:text-[#737373] uppercase tracking-widest min-h-[40px]">
      <Link
        to="/home/dashboard"
        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 active:scale-95"
      >
        <FiHome size={14} />
        <span className="hidden sm:inline">Inicio</span>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <FiChevronRight
            size={12}
            className="text-gray-300 dark:text-[#262626]"
          />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer outline-none border-none bg-transparent p-0 font-bold uppercase tracking-widest text-[10px] sm:text-xs active:scale-95"
            >
              {item.label}
            </button>
          ) : item.path ? (
            <Link
              to={item.path}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors active:scale-95"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 dark:text-[#f5f5f5]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
export default Breadcrumbs;
