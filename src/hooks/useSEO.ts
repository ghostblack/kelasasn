import { useEffect } from 'react';

export const useSEO = (title: string, description?: string) => {
  useEffect(() => {
    // Save original title if needed, though usually not necessary for SPA unless unmounting
    const originalTitle = document.title;
    
    // Update Document Title
    if (title) {
      document.title = title;
    }

    // Update Meta Description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', description);
        document.head.appendChild(metaDescription);
      }
    }

    // Optional: Cleanup function if we wanted to revert on unmount, 
    // but in SPA we typically want the title to just reflect the current page.
    return () => {
      // document.title = originalTitle; // Usually commented out for seamless navigation
    };
  }, [title, description]);
};
