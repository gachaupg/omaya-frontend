import React from "react";

interface NotFoundProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ searchQuery, onClearSearch }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl shadow-sm">
      <div className="w-20 h-20 mb-6 text-primary-600 opacity-80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
        No Results Found
      </h2>

      <p className="text-gray-600 mb-8 max-w-md">
        {searchQuery
          ? `We couldn't find any matches for "${searchQuery}". Try adjusting your search or filters.`
          : "No items match your current search criteria. Try adjusting your filters or search terms."}
      </p>

      {onClearSearch && (
        <button
          onClick={onClearSearch}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          Clear Search
        </button>
      )}
    </div>
  );
};

export default NotFound;
