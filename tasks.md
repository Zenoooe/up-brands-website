# Tasks

- [ ] **Setup**
    - [ ] Create `src/components/project` directory if it doesn't exist.

- [ ] **Refactor VimeoBlock**
    - [ ] Move `VimeoBlock` from `ProjectDetail.tsx` to `src/components/ui/VimeoBlock.tsx` (or `src/components/project/VimeoBlock.tsx`).
    - [ ] Implement dynamic import for `@vimeo/player`.
    - [ ] Add `IntersectionObserver` (or `react-intersection-observer`) to only initialize player when visible.

- [ ] **Create ProjectGallery Component**
    - [ ] Create `src/components/project/ProjectGallery.tsx`.
    - [ ] Move gallery rendering logic from `ProjectDetail.tsx` to this new component.
    - [ ] Wrap in `React.memo`.
    - [ ] Define explicit props interface.

- [ ] **Create ProjectDescription Component**
    - [ ] Create `src/components/project/ProjectDescription.tsx`.
    - [ ] Move title, category, description, translation logic, and credits grid here.
    - [ ] Move `isExpanded` state into this component.
    - [ ] Ensure `OpenCC` and `DOMPurify` logic is encapsulated here.

- [ ] **Update ProjectDetail Page**
    - [ ] Import and use `ProjectDescription` and `ProjectGallery` in `src/pages/ProjectDetail.tsx`.
    - [ ] Remove the moved logic and state variables (e.g., `isExpanded`, `cn2tw`, `cleanDescription`, etc.) from the main page component.
    - [ ] Verify `HeroImage` (motion div) remains in `ProjectDetail` or is also extracted if needed (keeping it in main page for now as it's the LCP element).

- [ ] **Verification**
    - [ ] Verify "Read More" toggle works and is snappy.
    - [ ] Verify Gallery renders correctly with all layouts.
    - [ ] Verify Vimeo videos play correctly.
    - [ ] Check console for any new errors.
