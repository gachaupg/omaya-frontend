import { describe, it, expect, vi, beforeEach } from "vitest";
import { showToast } from "@/lib/utils/toast";
import { handleApiError } from "@/lib/utils/errorHandler";

// Mock the toast and error handler
vi.mock("@/lib/utils/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/utils/errorHandler", () => ({
  handleApiError: vi.fn(),
}));

describe("Swap Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show error toast for 500 server error", () => {
    const error = {
      response: {
        status: 500,
        data: {
          message: "Internal server error",
        },
      },
    };

    handleApiError(error);

    expect(showToast.error).toHaveBeenCalledWith(
      "Server Error",
      "Please try again later"
    );
  });

  it("should show error toast for 400 bad request", () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: "Invalid request data",
        },
      },
    };

    handleApiError(error);

    expect(showToast.error).toHaveBeenCalledWith(
      "Error Trying to Make The Request",
      "Invalid request data"
    );
  });

  it("should show error toast for network errors", () => {
    const error = {
      message: "Network Error",
    };

    handleApiError(error);

    expect(showToast.error).toHaveBeenCalledWith(
      "Network Error",
      "Please check your connection"
    );
  });

  it("should show success toast for successful operations", () => {
    showToast.success("Operation completed", "Success message");

    expect(showToast.success).toHaveBeenCalledWith(
      "Operation completed",
      "Success message"
    );
  });
});
