# High Five Me - Frontend

React frontend for the High Five Me application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file (or set environment variables in Vercel):

```
VITE_BACKEND_URL=your-backend-url-here
```

3. Run development server:

```bash
npm run dev
```

## Deployment to Vercel

1. Install Vercel CLI (if not already installed):

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variable in Vercel dashboard:
   - Go to your project settings
   - Add `VITE_BACKEND_URL` with your Render backend URL

Or deploy via GitHub:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the `VITE_BACKEND_URL` environment variable
4. Deploy

## Environment Variables

- `VITE_BACKEND_URL`: The URL of your backend server (e.g., `https://your-app.onrender.com`)
