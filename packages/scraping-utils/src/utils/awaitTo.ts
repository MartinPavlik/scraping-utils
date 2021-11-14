type Result<T, E> = [E, undefined] | [undefined, T];

export const to = async <T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> => {
  try {
    const result: T = await promise;
    return [undefined, result];
  } catch (e: any) {
    return [e, undefined];
  }
};
