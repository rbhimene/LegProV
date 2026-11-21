import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls to #section links (works from any page) and to the top on page change. */
const ScrollToHash = () => {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) {
      const timer = setTimeout(
        () => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [hash, pathname]);
  return null;
};

export default ScrollToHash;