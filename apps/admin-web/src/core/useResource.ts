import { useEffect, useState } from "react";

export function useResource<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setData(result);
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, deps);

  return { data, isLoading, error };
}
