# Local Hook CLI

## Overview

`local-hook-cli` is a WebSocket client CLI designed to interact with a WebSocket server and forward specific events to a microservice. The tool is ideal for local development, enabling you to test WebSocket interactions by sending event payloads to a locally running microservice.

## Features

- **WebSocket Connection**: Connects to a WebSocket server.
- **Event Handling**: Filters and processes specific events (e.g., `user.login`, `order.created`).
- **Webhook Forwarding**: Sends the event payload to a specified microservice URL.
- **Logging**: Provides detailed logs for debugging and tracking.

## Requirements

- Node.js (>= v14)
- WebSocket server URL (local or remote)
- Microservice URL (e.g., `http://localhost:5000`)

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/BSO-Space/local-hook-cli.git
cd local-hook-cli
npm install
npm run build
```

## Usage

### Using Node.js Directly

```bash
node dist/cli.js listen --url ws://some.webhook.com:5434 --forward http://localhost:5000 --event user.login order.created --token your-auth-token
```

### Using `local-hook-cli` Command

After installing globally:

```bash
npm install -g local-hook-cli
```

Now, you can run:

```bash
local-hook-cli listen --url ws://some.webhook.com:5434 --forward http://localhost:5000 --event user.login order.created --token your-auth-token
```

### Command Options

- `--url` or `-u`: WebSocket server URL.
- `--forward` or `-f`: Microservice URL to forward the payload.
- `--event` or `-e`: Events to listen for, space-separated (e.g., `user.login order.created`).
- `--token` or `-t`: Authentication token.

### Example

```bash
local-hook-cli listen --url ws://some.webhook.com:5434 --forward http://localhost:5000 --event user.login order.created --token cm3bwtymf0000qj6vr8ykrdku
```

## Payload Format

The server sends messages in two possible formats:

1. **Plain Text** (Ignored unless JSON):

   ```
   Hello World, blog 🎉👋
   ```
2. **JSON** (Processed if event matches):

   ```json
   {
     "payload": "{\"event\":\"user.login\",\"user\":{\"id\":\"9cdf2c76-8f9b-4ec7-b298-a98516f61b6f\",\"username\":\"example.user\",\"email\":\"example@gmail.com\"},\"ip\":\"::ffff:192.168.112.1\"}",
     "signature": "5f550b059312f2443e472c170d67ffea0a99df1b127b1d64a45eb0341cfca398",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Y2RmMmM3Ni04ZjliLTRlYzctYjI5OC1hOTg1MTZmNjFiNmYiLCJzZXJ2aWNlIjoiYmxvZyIsImlwIjoiOjpmZmZmOjE5Mi4xNjguMTEyLjEiLCJ1c2VyQWdlbnQiOiJNb3ppbGxhLzUuMCBDaHJvbWUvMTMwLjAiLCJpYXQiOjE3MzEzOTQxOTAsImV4cCI6MTczMTM5NDQ5MH0.Do1bYfL8xUYA77AtjWRLhyAPi3QGHEXztj-85vuGA5s"
   }
   ```

### Event Payload Example

For `user.login` event:

```json
{
  "event": "user.login",
  "user": {
    "id": "9cdf2c76-8f9b-4ec7-b298-a98516f61b6f",
    "username": "example.user",
    "username": "example.user",
    "email": "example@gmail.com"
  },
  "ip": "::ffff:192.168.112.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
```

## Example WebSocket 
Here’s a sample WebSocket server that the CLI can connect to
```
import { WebSocketServer, WebSocket } from "ws"; 
import http from "http"; 
import { envConfig } from "./config/env.config"; 
import { ServicesService } from "./services/service.service"; 
import app from "./app";

// Create the HTTP server using an Express app.
const server = http.createServer(app); 

// Service responsible for handling service-related logic.
const servicesService = new ServicesService(); 

// Store active WebSocket clients mapped by their IDs.
export let webSocketClients: Map<string, WebSocket> = new Map(); 

// Initialize the WebSocket server.
const wss = new WebSocketServer({ server }); 

wss.on("connection", (ws) => { 
  let clientId: string | null = null; 

  // Handle incoming messages from the client.
  ws.on("message", async (message: string) => { 
    try {
      const data = JSON.parse(message); // Parse incoming JSON message.

      // Validate the token and retrieve service details.
      const existingService = await servicesService.findByToken(data.token); 

      if (existingService) { 
        clientId = existingService.id; // Assign client ID.
        if (clientId) {
          // Store WebSocket client.
          webSocketClients.set(clientId, ws); 
          console.log(`${existingService.name} service connected🌈🎉`); 
        }

        // Send acknowledgment message to the client.
        ws.send(`Hello World, ${existingService.name} 🎉👋`); 
      } else {
        // Send error response if token is invalid.
        ws.send(JSON.stringify({ message: "Token not valid" })); 
      }
    } catch (error) {
      console.error("Error parsing client message", error); // Log parsing errors.
    }
  });

  // Handle client disconnection.
  ws.on("close", () => { 
    if (clientId) {
      // Remove the disconnected client from the active client map.
      webSocketClients.delete(clientId); 
      console.log(`Client with ID ${clientId} disconnected.`); 
    }
  });
});

// Start the HTTP and WebSocket server on the specified port.
server.listen(envConfig.APP_PORT, () => { 
  console.log(`Server running on http://localhost:${envConfig.APP_PORT}`); 
});

```
## Logging

Logs include timestamps and types for easy tracking:

- **INFO**: General operation logs.
- **ERROR**: Issues with invalid JSON or failed requests.

## License

This project is licensed under the MIT License.
