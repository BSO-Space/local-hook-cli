
# WebSocket Client CLI for Microservice Interaction

This project contains a CLI application that interacts with a WebSocket server and sends login notifications to a microservice when the `user.login` event is received. It is designed to be used in development environments where WebSocket messages are received and then sent to a microservice via a webhook on `localhost`.

## Features

- **WebSocket connection**: Connects to a WebSocket server and sends a connection message with a token and microservice URL.
- **Event handling**: Handles `user.login` events from the WebSocket server and sends the data to a specified microservice URL.
- **Webhook integration**: The application sends a POST request to a microservice using a webhook URL on `localhost`, making it ideal for local development and testing.
- **Logging**: Logs messages with timestamps for better tracking and troubleshooting.

## Requirements

- Node.js (>= v14)
- WebSocket server running at a specified URL (local or remote)
- A microservice capable of handling `user.login` events at the provided URL (typically a local server, e.g., `http://localhost:3001/open/hook`)
- `node-fetch` for sending HTTP requests

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/BSO-Space/socketlink.git
   cd websocket-client-cli
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

You can use the CLI tool to connect to the WebSocket server and interact with the microservice.

### Command Line Arguments

- `--url` or `-u`: WebSocket server URL (e.g., `ws://localhost:3005` or `ws://example.com`)
- `--microservice-url` or `-m`: Microservice URL to send the login data to (e.g., `http://localhost:3001/open/hook`), ideal for local testing environments.
- `--token` or `-t`: Authentication token to send with the microservice URL.

### Example

```bash
node cli.js --url ws://localhost:3005 --microservice-url "http://localhost:3001/open/hook" --token "cm3bwtymf0000qj6vr8ykrdku"
```

### Expected Output

1. **Connection message**: The client connects to the WebSocket server and sends the token and microservice URL.
   - Example:
     ```bash
     [2024-11-11T11:42:30.666Z] [INFO] Connected to WebSocket server at ws://localhost:3005
     [2024-11-11T11:42:30.668Z] [INFO] Sending connection message with token and microservice URL
     ```

2. **Received message**: Any general WebSocket messages will be logged, except for the `user.login` events.
   - Example:
     ```bash
     [2024-11-11T11:42:30.935Z] [INFO] General WebSocket Message: Hello World, blog 🎉👋
     [2024-11-11T11:42:30.935Z] [ERROR] Incoming message is not valid JSON: Hello World, blog 🎉👋
     ```

3. **Handling `user.login` event**: When a `user.login` event is received, it sends the data to the microservice.
   - Example:
     ```bash
     [2024-11-11T11:42:45.573Z] [INFO] Handling 'user.login' event from WebSocket server
     ```

### Local Development Use Case

This CLI tool is ideal for **local development** when you're testing WebSocket interactions and need to send data to your locally running microservice (e.g., on `http://localhost:3001`). The tool listens for `user.login` events on the WebSocket server and forwards this data directly to your microservice via a webhook.

This setup is helpful when you are developing and testing your microservice and need to simulate the interaction with the WebSocket server in a local environment.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
