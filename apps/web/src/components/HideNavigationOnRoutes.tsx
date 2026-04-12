'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface HideNavigationOnRoutesProps {
  children: ReactNode;
  hideOn?: string[];
}

const DEFAULT_HIDE_ON = [
  '/',           // Landing page
  '/login',      // Login page
  '/signup',     // Signup page
  '/join',       // Join page (guest access)
];

export function HideNavigationOnRoutes({ 
  children, 
  hideOn = DEFAULT_HIDE_ON 
}: HideNavigationOnRoutesProps) {
  const pathname = usePathname();
  
  // Check if current path matches any of the hideOn patterns
  const shouldHide = hideOn.some(path => {
    // Exact match
    if (pathname === path) return true;
    // Prefix match (for dynamic routes like /room/[id])
    if (path.includes('[id]')) {
      const basePath = path.replace('/[id]', '');
      return pathname.startsWith(basePath + '/');
    }
    return false;
  });

  if (shouldHide) {
    return null;
  }

  return <>{children}</>;
}
