import { toApiErrorMessage } from "@/lib/http/apiClient";

export async function apiRequest<T>(promise: Promise<{ data: T }>, fallback: string): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, fallback));
  }
}
