import { useEffect, useRef, useState } from 'react';

/**
 * Becomes true once the element has actually been on screen, and stays true.
 *
 * Used to delay loading Google Place Photos (billed per photo request) until a
 * card is really visible. Native `loading="lazy"` starts fetching far outside
 * the viewport, so in a list of 20 results it ends up fetching nearly every
 * photo anyway.
 */
export function useInViewOnce<T extends Element>(minVisibleMs = 250) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          // Require the card to stay visible briefly so fast scrolling past
          // a card does not trigger a paid photo request.
          if (!timer) {
            timer = setTimeout(() => {
              setSeen(true);
              observer.disconnect();
            }, minVisibleMs);
          }
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [seen, minVisibleMs]);

  return [ref, seen] as const;
}
