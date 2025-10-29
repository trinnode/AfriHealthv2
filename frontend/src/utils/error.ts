export function extractErrorMessage(
  error: unknown,
  fallback = "An error occurred"
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}
