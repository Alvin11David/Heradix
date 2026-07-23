export type Result<T, E = AppError> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Failure<E = AppError> {
  readonly ok: false;
  readonly error: E;
}

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}

export function isSuccess<T, E>(r: Result<T, E>): r is Success<T> {
  return r.ok;
}

export function isFailure<T, E>(r: Result<T, E>): r is Failure<E> {
  return !r.ok;
}

export function mapResult<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? success(fn(r.value)) : r;
}

export function flatMapResult<T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

export function getOrThrow<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error;
}

export function getOrDefault<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;
