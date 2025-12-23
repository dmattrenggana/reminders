/**
 * Utility for handling image loading errors
 * Prevents console errors and provides fallback handling
 */

import { useState } from "react";

export interface ImageErrorHandlerOptions {
  onError?: () => void;
  suppressConsole?: boolean;
}

/**
 * Creates an error handler for image elements
 * Prevents event propagation and console errors
 */
export function createImageErrorHandler(
  setError: (value: boolean) => void,
  options: ImageErrorHandlerOptions = {}
): (e: React.SyntheticEvent<HTMLImageElement, Event>) => boolean {
  const { onError, suppressConsole = true } = options;

  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Prevent default error behavior
    e.preventDefault();
    e.stopPropagation();

    // Suppress console errors if enabled
    if (suppressConsole) {
      // Silently handle the error - don't log to console
    }

    // Set error state
    setError(true);

    // Call custom error handler if provided
    if (onError) {
      onError();
    }

    // Return false to prevent default error handling
    return false;
  };
}

/**
 * Hook for managing image error state
 */
export function useImageError() {
  const [hasError, setHasError] = useState(false);

  const handleError = createImageErrorHandler(setHasError);
  const reset = () => setHasError(false);

  return {
    hasError,
    handleError,
    reset,
  };
}

