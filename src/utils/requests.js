export const makeRequestWithRetry = async (
  requestFunction,
  maxRetries = 3,
  baseDelay = 1000,
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFunction();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.pow(2, attempt - 1) * baseDelay;
      console.warn(
        `Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export function getURLParams({ URL, endpoint, returnObject = false }) {
  if (returnObject) {
    return Object.fromEntries(new URLSearchParams(URL?.split('?')?.[1]));
  }
  return URL?.split(endpoint)?.[1];
}
