# Checklist

- [ ] **Functionality**
    - [ ] "Read More" / "Collapse" button works.
    - [ ] Project title and categories are displayed correctly.
    - [ ] Traditional/Simplified Chinese conversion works.
    - [ ] Gallery images load correctly (Supabase & CDN).
    - [ ] Vimeo videos load and play.
    - [ ] Gallery layout configuration (grid/stack/centered/full) is respected.

- [ ] **Performance (INP Focus)**
    - [ ] Toggling "Read More" does **not** trigger a re-render of `ProjectGallery` (verify with React DevTools Profiler or console logs).
    - [ ] `@vimeo/player` is not loaded in the initial bundle (check Network tab).

- [ ] **Code Quality**
    - [ ] No ESLint errors.
    - [ ] No "Rendered more hooks" errors.
    - [ ] Components are typed correctly with TypeScript.
