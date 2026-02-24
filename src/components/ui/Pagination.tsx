import React from "react";
import { Icon } from "@iconify/react";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  lastPage,
  total,
  from,
  to,
  perPage,
  onPageChange,
  onPerPageChange,
}) => {
  const range = 1;
  const pages: (number | string)[] = [];

  for (let i = 1; i <= lastPage; i++) {
    if (
      i === 1 ||
      i === lastPage ||
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i);
    } else if (
      i === currentPage - range - 1 ||
      i === currentPage + range + 1
    ) {
      pages.push("...");
    }
  }

  const uniquePages = pages.filter((page, index) => {
    return page !== "..." || pages[index - 1] !== "...";
  });

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold">{from || 0}</span> to{" "}
          <span className="font-semibold">{to || 0}</span> of{" "}
          <span className="font-semibold">{total}</span> results
        </div>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4 inline mr-1" />
          Prev
        </button>

        <div className="flex items-center gap-1 mx-1">
          {uniquePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(Number(page))}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-semibold transition-all ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "border border-black hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          disabled={currentPage === lastPage}
          className="p-2 border border-black rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <Icon icon="hugeicons:arrow-right-01" className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
