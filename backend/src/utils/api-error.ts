export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const isApiError = (value: unknown): value is ApiError => {
  return value instanceof ApiError;
};

