export class AppError extends Error {
  constructor(
    override message: string,
    public statusCode?: number,
    options?: ErrorOptions,
  ) {
    super(
      typeof message === "string" ? message : JSON.stringify(message),
      options,
    );
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.message = message;
  }
}
