import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const routeMap: Record<string, string> = {
  '1': '/',
  '2': '/downloads',
  '3': '/search',
  '4': '/history',
  '5': '/wishlist',
  '6': '/settings',
};

/**
 * Global keyboard shortcuts:
 *  Ctrl+1…6  — navigate to page
 *  Ctrl+F    — focus the URL / search input
 *  Escape    — blur active element
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+1…6 navigation
      if (ctrl && routeMap[e.key]) {
        e.preventDefault();
        navigate(routeMap[e.key]);
        return;
      }

      // Ctrl+F — focus the first visible input (URL bar / search)
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[type="text"], input[type="search"], input[type="url"]',
        );
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }

      // Escape — blur
      if (e.key === 'Escape') {
        (document.activeElement as HTMLElement)?.blur?.();
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
