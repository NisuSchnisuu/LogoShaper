# LogoShaper (Iconer)

LogoShaper is a high-performance, privacy-focused web application designed to transform standard square icons and logos into professional shapes (Circle, Squircle, Rounded Square). It provides a sleek, modern UI for brand asset customization with real-time previews and high-resolution exports.

## Project Overview

- **Core Purpose:** Client-side image processing to apply professional masking to logos.
- **Primary Technologies:**
  - **Framework:** React 19 (Functional Components, Hooks)
  - **Build Tool:** Vite 7
  - **Language:** TypeScript
  - **Styling:** Tailwind CSS v4 (@theme variable system)
  - **Icons:** Material Symbols Outlined
  - **Processing:** HTML5 Canvas API (for high-resolution exports)
- **Architecture:** 
  - Single Page Application (SPA) using a custom `view` state management in `App.tsx`.
  - Step-based workflow: Dashboard -> Upload -> Mode Selection -> Editor (Auto/Manual) -> Completion.
  - Performance-oriented: All image processing happens locally in the browser; no data is sent to a server.

## Building and Running

The project uses standard npm scripts for development and production:

- **Development:** `npm run dev` (Starts Vite dev server)
- **Production Build:** `npm run build` (Runs TypeScript compiler and Vite build)
- **Linting:** `npm run lint` (Runs ESLint)
- **Preview Build:** `npm run preview` (Local server for built artifacts)

## Development Conventions

- **Styling:**
  - Uses Tailwind CSS v4 with custom theme variables defined in `src/index.css`.
  - Prefer using theme variables (e.g., `text-primary`, `bg-background-dark`) for consistency.
  - Icons are implemented using Material Symbols: `<span class="material-symbols-outlined">icon_name</span>`.
- **Components:**
  - All UI components reside in `src/components/`.
  - Use TypeScript interfaces for all component props.
- **Image Handling:**
  - Standardized export resolution is 1024x1024 pixels.
  - Uses `URL.createObjectURL` for temporary previews and Canvas API for the final render.
- **Typography:**
  - Primary font is "Inter", with "Material Symbols Outlined" for iconography.
