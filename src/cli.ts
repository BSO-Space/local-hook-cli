import WebSocket from "ws";
import yargs from "yargs";
import fetch from "node-fetch";
import figlet from "figlet";
import chalk from "chalk";

console.log(
  chalk.green(
    figlet.textSync("BSO CLI", {
      horizontalLayout: "full",
      verticalLayout: "default",
      width: 80,
      whitespaceBreak: true,
    })
  )
);
console.log(chalk.yellow("Socketlink is running...\n"));

// CLI arguments
const argv = await yargs(process.argv.slice(2))
  .option("url", {
    alias: "u",
    type: "string",
    demandOption: true,
    description: "WebSocket server URL, e.g., ws://localhost:3001",
  })
  .option("microservice-url", {
    alias: "m",
    type: "string",
    demandOption: true,
    description: "Local URL of the microservice, e.g., http://localhost:5000",
  })
  .option("token", {
    alias: "t",
    type: "string",
    demandOption: true,
    description: "Authentication token to send with the microservice URL",
  })
  .help()
  .alias("help", "h").argv;

const url: string = argv.url;
const microserviceUrl: string = argv["microservice-url"];
const token: string = argv.token;

// Create a WebSocket client
const ws = new WebSocket(url);

// Function to get the current time in ISO format
function getCurrentTime(): string {
  return new Date().toISOString();
}

ws.on("open", () => {
  console.log(
    `[${getCurrentTime()}] [INFO] Connected to WebSocket server at ${url}`
  );

  // Combine token and microservice URL into one object
  const message = {
    token: token,
    microserviceUrl: microserviceUrl,
  };

  // Send the message as a JSON string
  console.log(
    `[${getCurrentTime()}] [INFO] Sending connection message with token and microservice URL`
  );
  ws.send(JSON.stringify(message));
});

// Handle incoming WebSocket message
ws.on("message", async (data: WebSocket.Data) => {
  const message = data.toString();
  console.log(`[${getCurrentTime()}] [INFO] Received message: ${message}`);

  // Log all messages except 'user.login' events
  if (!message.includes("user.login")) {
    console.log(
      `[${getCurrentTime()}] [INFO] General WebSocket Message: ${message}`
    );
  }

  // Only attempt to parse the message if it's JSON
  if (isJsonString(message)) {
    try {
      const result = JSON.parse(message);

      if (result.event == "user.login") {
        console.log(`[${getCurrentTime()}] [INFO] Handling 'user.login' event`);

        // Mask the payload before logging
        const maskedPayload = {
          user: {
            id: result.payload.user.id,
            username: result.payload.user.username,
          },
          service: result.payload.service,
          ip: result.payload.ip,
          userAgent: result.payload.userAgent,
        };

        // Log the masked payload
        console.log(
          `[${getCurrentTime()}] [INFO] Sending login data to microservice:`,
          maskedPayload
        );

        // Send data to microservice
        const res = await fetch(microserviceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hook-token": result.token,
            "x-hook-signature": result.signature,
          },
          body: JSON.stringify(result.payload),
        });

        const resData = await res.json();

        if (res.ok) {
          console.log(
            `[${getCurrentTime()}] [INFO] Data sent to microservice successfully`
          );
        } else {
          console.error(
            `[${getCurrentTime()}] [ERROR] Error sending data to microservice:`,
            resData
          );
        }
      }
    } catch (error) {
      console.error(
        `[${getCurrentTime()}] [ERROR] Failed to parse incoming message or handle event:`,
        (error as Error).message
      );
    }
  } else {
    console.error(
      `[${getCurrentTime()}] [ERROR] Incoming message is not valid JSON:`,
      message
    );
  }
});

// Utility function to check if a string is valid JSON
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Handle WebSocket errors
ws.on("error", (error: Error) => {
  console.error(
    `[${getCurrentTime()}] [ERROR] WebSocket error: ${error.message}`
  );
});

// Handle WebSocket close event
ws.on("close", () => {
  console.log(`[${getCurrentTime()}] [INFO] WebSocket connection closed`);
});
