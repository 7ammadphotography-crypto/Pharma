# Pharma Target

An intelligent, gamified learning platform for pharmacy students.

## Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Associate your project with Vercel or create a `.env` file with:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (Only for local seeding)

3.  **Database Seeding**
    To populate the database with initial Categories, Topics, and Questions:
    ```bash
    npm run seed
    ```

4.  **Development**
    ```bash
    npm run dev
    ```

## Admin Features
- Navigate to `/admin` (Must have `role: 'admin'` in `profiles` table).
- Manage Users, Chapters, Topics, Cases, and Questions.