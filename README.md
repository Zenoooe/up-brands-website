# Up-Brands Website

This is the official website for **Up-Brands**, a creative visual and brand strategy agency.

## 🚀 Tech Stack

- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Database**: Supabase
- **Internationalization**: i18next (English / Traditional Chinese / Simplified Chinese)
- **Deployment**: Vercel

## 🛠️ Features

- **Responsive Design**: Optimized for all devices.
- **Dynamic Content**: Blog posts and projects are managed via Supabase.
- **Admin Dashboard**: Secure backend (`/admin`) to manage content:
  - Add/Edit/Delete Projects & Blog Posts
  - Drag-and-drop sorting
  - Toggle visibility
  - View newsletter subscribers
- **SEO Optimized**: Dynamic meta tags and sitemap generation.
- **Behance Sync**: One-click sync to import projects from Behance.

## 📦 Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start development server**:
    ```bash
    npm run dev
    ```

3.  **Build for production**:
    ```bash
    npm run build
    ```

## 🌍 Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
