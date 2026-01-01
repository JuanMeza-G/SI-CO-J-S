import React from "react";


/** Componente de carga visual (spinner) */
const Loader = ({ fullScreen = false, size = "medium", text }) => {
  const sizeClasses = {
    small: "w-5 h-5 border-2",
    medium: "w-8 h-8 border-4",
    large: "w-12 h-12 border-4",
  };

  const spinner = (
    <div
      className={`
      ${sizeClasses[size]}
      border-blue-200 border-t-blue-600 rounded-full animate-spin
      dark:border-[#262626] dark:border-t-blue-500
    `}
    ></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
        {spinner}
        {text && (
          <p className="text-gray-600 dark:text-[#e5e5e5] font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      {spinner}
      {text && (
        <p className="text-sm text-gray-500 dark:text-[#a3a3a3]">{text}</p>
      )}
    </div>
  );
};

export default Loader;
