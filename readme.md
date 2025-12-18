# todo:

- add theme toggler
- default to dark theme
- deploy
- setup posthog

# High Five Me 👋

A real-time collaborative web app where users can click anywhere on the page and "high-five" each other when they click in the same position!

## Features

- Real-time click tracking across multiple users
- Automatic matching when clicks are within 2% of screen size
- Visual feedback with animations for clicks and high-fives
- One click can match multiple other clicks
- Active clicks automatically clear after 5 seconds
- User count display

## Project Structure

```
high-five-me/
├── frontend/          # React + Vite frontend (deploy to Vercel)
├── backend/           # Node.js + Express + Socket.io backend (deploy to Render)
└── readme.md
```

## Quick Start

### Backend Setup

1. Navigate to backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. Run development server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```
VITE_BACKEND_URL=http://localhost:5000
```

4. Run development server:

```bash
npm run dev
```

5. Open http://localhost:3000 in multiple browser windows to test!

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. Add environment variable:
   - `FRONTEND_URL`: Your Vercel frontend URL

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable:
   - `VITE_BACKEND_URL`: Your Render backend URL
4. Deploy

## How It Works

1. Users connect via WebSocket (Socket.io)
2. When a user clicks, the position is normalized to screen ratios (0.0-1.0)
3. The click is broadcast to all connected users
4. The backend checks if the new click matches any existing clicks (within 2% threshold)
5. If matches are found, a "HIGH FIVE!" animation is triggered
6. Clicks automatically expire after 5 seconds

## Tech Stack

- **Frontend**: React, Vite, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Deployment**: Vercel (frontend), Render (backend)
