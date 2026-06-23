# retro-neon-pinball

A browser-based retro neon pinball cabinet experience served via an Express.js backend. The game features a vibrant neon arcade theme, responsive touch controls, score tracking, high score display, and custom synthesized sound effects driven by the Web Audio API.

## Features

- Retro neon cabinet UI with glowing effects and arcade fonts
- Interactive pinball gameplay with left/right flippers, plunger launch, nudge, and mobile touch controls
- Scoreboard, diagnostics panel, target progress, and high score hall of fame
- Custom audio synthesis for bumpers, flippers, launch, jackpot, and tilt effects
- Responsive layout designed to fit both desktop and mobile screens
- Express.js backend for serving static assets and API routes

## Built With

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API

## Project Structure

```text
retro-neon-pinball/
├── public/               # Static frontend assets (HTML, CSS, JS)
│   ├── css/
│   ├── js/
│   └── index.html
├── src/                  # Express.js backend source code
│   ├── middleware/       # Custom Express middleware
│   ├── routes/           # API and page routes
│   └── server.js         # Entry point for the Express server
├── .env.example          # Environment variable template
├── package.json          # Node.js dependencies and scripts
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   cd retro-neon-pinball
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example environment file and adjust if necessary.
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Or to run the production server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000` (or the port specified in your `.env` file).