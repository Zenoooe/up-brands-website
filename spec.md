# Project Detail INP Optimization Specification

## 1. Problem Analysis
The `ProjectDetail` page currently suffers from poor Interaction to Next Paint (INP) scores (~640ms). This is likely due to:
1.  **Heavy Re-renders**: Toggling the "Read More" / "Collapse" description state causes the entire component tree, including the heavy image gallery and video players, to re-render.
2.  **Main Thread Blocking**: Synchronous operations or heavy initializations (like `OpenCC` or `Vimeo Player`) might be blocking the main thread during interaction.
3.  **Large DOM Updates**: The gallery contains many high-resolution images and iframes, making re-renders expensive.

## 2. Optimization Strategy

### 2.1 Component Extraction & Memoization
We will decompose `ProjectDetail.tsx` into smaller, memoized components to isolate state updates.

-   **`ProjectGallery` Component**:
    -   **Responsibility**: Renders the grid/stack of project images and videos.
    -   **Props**: `images` (string[]), `layout` (string), `gap` (number), `title` (string).
    -   **Optimization**: Wrapped in `React.memo`. It should **not** re-render when the parent's `isExpanded` state changes.
    
-   **`ProjectDescription` Component**:
    -   **Responsibility**: Handles the multi-language description, translation (OpenCC), sanitization (DOMPurify), and the "Read More" toggle.
    -   **Props**: `project` (Project object), `t` (translation function), `i18n` (i18n instance).
    -   **Optimization**: Manages its own `isExpanded` state. This ensures that clicking "Read More" only re-renders this small text block, not the entire gallery.

### 2.2 Lazy Loading & Code Splitting
-   **Vimeo Player**:
    -   The `@vimeo/player` SDK is heavy. We will refactor `VimeoBlock` to dynamically import this library only when the component mounts or intersects the viewport.
    -   We will also use `IntersectionObserver` to defer the initialization of the player until the user actually scrolls to the video.

-   **OpenCC**:
    -   The Chinese conversion library is large. We will ensure `opencc-js` is imported dynamically or its heavy initialization is kept off the main render path (using `useEffect` or a Web Worker if necessary, though `useEffect` is a good first step).

### 2.3 Image Optimization (Existing but Verified)
-   Ensure `ResponsiveImage` and `getSupabaseUrl` are used correctly to serve appropriately sized images (already implemented, but we will verify usage in the extracted gallery).

## 3. Implementation Details

### `src/components/project/ProjectGallery.tsx`
```tsx
import { memo } from 'react';
// ... imports

export const ProjectGallery = memo(({ images, layout, gap, title }: ProjectGalleryProps) => {
  // Rendering logic moved from ProjectDetail
}, (prev, next) => {
  // Custom comparison if needed, or default shallow compare
  return prev.images === next.images && prev.layout === next.layout;
});
```

### `src/components/project/ProjectDescription.tsx`
```tsx
export const ProjectDescription = ({ project }: ProjectDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // OpenCC and DOMPurify logic here
  
  return (
    // ... JSX for title, tags, description, credits
  );
};
```

### `src/components/ui/VimeoBlock.tsx` (Refactor)
```tsx
// Inside useEffect
if (isInView) {
  import('@vimeo/player').then(({ default: Player }) => {
    // Initialize player
  });
}
```

## 4. Expected Outcome
-   **INP Reduction**: Toggling description should happen in < 50ms (previously ~600ms+ implied).
-   **LCP Improvement**: Prioritizing hero image loading (already done) + reducing main thread work during hydration.
-   **Code Maintainability**: Cleaner `ProjectDetail.tsx` with separated concerns.
