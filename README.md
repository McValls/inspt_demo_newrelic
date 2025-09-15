# Monitoring API with New Relic Integration

A Node.js Express application with New Relic monitoring integration.

## Features

- Health check endpoint (`/health`)
- PI calculation endpoint (`/pi`) - returns first 10 digits of PI
- New Relic monitoring and tracing
- Environment-based configuration

## Prerequisites

- Node.js 24.x (using nvm: `nvm use 24`)
- npm

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update `NEW_RELIC_LICENSE_KEY` with your actual New Relic license key
   - Update `NEW_RELIC_APP_NAME` if desired

## Configuration

The application uses the following environment variables:

- `NEW_RELIC_LICENSE_KEY`: Your New Relic license key
- `NEW_RELIC_APP_NAME`: Application name for New Relic (default: monitoring-app)
- `NEW_RELIC_DISTRIBUTED_TRACING_ENABLED`: Enable distributed tracing (default: true)
- `NEW_RELIC_LOG_ENABLED`: Enable New Relic logging (default: true)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (default: development)

## Running the Application

Start the server:
```bash
npm start
```

Or run directly:
```bash
node app.js
```

## API Endpoints

### GET /
Returns API information and available endpoints.

### GET /health
Health check endpoint that returns:
- Status
- Timestamp
- Uptime
- Environment

### GET /pi
Returns the first 10 digits of PI (3.141592654).

## New Relic Integration

The application automatically integrates with New Relic for:
- Performance monitoring
- Error tracking
- Distributed tracing
- Application logging

Make sure to set your New Relic license key in the `.env` file before running the application.

## Development

To run in development mode:
```bash
NODE_ENV=development node app.js
```

## License

ISC
