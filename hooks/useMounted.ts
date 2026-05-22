import { useEffect, useRef } from 'react';

/**
 * Returns a ref that's true while the component is mounted. Use in async
 * handlers to skip setState() after unmount and avoid the "Can't perform a
 * state update on an unmounted component" warning.
 *
 *   const mounted = useMounted();
 *   const load = async () => {
 *     const data = await fetchSomething();
 *     if (!mounted.current) return;     // safe — caller unmounted
 *     setData(data);
 *   };
 */
export function useMounted() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
