# Project Structure

This document provides an overview of the project's structure, detailing the purpose of each file and directory.

## Root Directory

- **`.firebaserc`**: Configuration file for Firebase projects and deployment targets.
- **`.gitignore`**: Specifies intentionally untracked files to be ignored by Git.
- **`README.md`**: Contains introductory information about the project.
- **`components.json`**: Configuration for `shadcn/ui`.
- **`eslint.config.mjs`**: Configuration for ESLint, a code linter.
- **`firebase.json`**: Defines which files and settings from your project directory are deployed to your Firebase project.
- **`jsconfig.json`**: JavaScript configuration file for setting up paths and other options.
- **`next.config.mjs`**: Configuration file for Next.js.
- **`package.json`**: Lists the project's dependencies and scripts.
- **`package-lock.json`**: Records the exact version of each installed dependency.
- **`postcss.config.mjs`**: Configuration for PostCSS, a tool for transforming CSS.

## `app`

This directory contains the core of the Next.js application, following the App Router structure.

- **`app/layout.js`**: The root layout of the application, wrapping all pages.
- **`app/globals.css`**: Global stylesheet for the application.
- **`app/page.js`**: The main landing page of the website.
- **`app/favicon.ico`**: The favicon for the application.

### `app/admin`

This section is for the admin dashboard.

- **`app/admin/layout.js`**: Layout for the admin section.
- **`app/admin/page.js`**: The main page of the admin dashboard.
- **`app/admin/members`**: Pages related to managing members.
  - **`app/admin/members/page.js`**: The main page for listing members.
  - **`app/admin/members/[userId]`**: Dynamic route for viewing or editing a specific member's details.
- **`app/admin/givesr`**:
  - **`app/admin/givesr/page.js`**: Page for managing "givesr".

### `app/dashboard`

This section is for the user dashboard.

- **`app/dashboard/page.js`**: The main page of the user dashboard.
- **`app/dashboard/settings/page.js`**: Page for user settings.

### `app/register`

This section handles user authentication.

- **`app/register/page.js`**: The user registration page.
- **`app/register/login/page.js`**: The user login page.
- **`app/register/reset-password/page.js`**: The password reset page.

## `components`

This directory contains reusable React components.

- **`components/theme-provider.jsx`**: Provides theme switching functionality (e.g., dark/light mode).
- **`components/auth`**: Components related to authentication.
  - **`AdminRoute.js`**: A wrapper to protect routes that should only be accessible to administrators.
  - **`ProtectedRoute.js`**: A wrapper to protect routes that require user authentication.
- **`components/ui`**: UI components from `shadcn/ui`.

## `functions`

This directory contains Firebase Cloud Functions.

- **`functions/index.js`**: The main file for Firebase Cloud Functions.
- **`functions/package.json`**: Lists dependencies for the Cloud Functions.

## `lib`

This directory contains libraries and helper functions.

- **`lib/AuthContext.js`**: Provides authentication state to the app through a React Context.
- **`lib/firebase.js`**: Initializes and configures the Firebase SDK.
- **`lib/utils.js`**: Utility functions used throughout the application.

## `public`

This directory contains static assets that are publicly accessible.

- **`*.svg`**: SVG image files.
