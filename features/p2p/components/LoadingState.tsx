import React from "react";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
};
