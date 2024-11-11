#!/usr/bin/env node

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
const argv = yargs(process.argv.slice(2))
  .command(
    "start",
    "Start the WebSocket connection and interact with the microservice",
    (yargs) => {
      return yargs
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
          description:
            "Local URL of the microservice, e.g., http://localhost:5000",
        })
        .option("token", {
          alias: "t",
          type: "string",
          demandOption: true,
          description: "Authentication token to send with the microservice URL",
        });
    },
    async (argv) => {
      await startWebSocket(argv.url, argv.microserviceUrl, argv.token);
    }
  )
  .help()
  .alias("help", "h").argv;

// Function to get the current time in ISO format
function getCurrentTime() {
  return new Date().toISOString();
}

// Function to start the WebSocket connection
async function startWebSocket(url, microserviceUrl, token) {
  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log(
      `[${getCurrentTime()}] [INFO] Connected to WebSocket server at ${url}`
    );

    const message = {
      token: token,
      microserviceUrl: microserviceUrl,
    };

    console.log(
      `[${getCurrentTime()}] [INFO] Sending connection message with token and microservice URL`
    );
    ws.send(JSON.stringify(message));
  });

  // Handle incoming WebSocket messages
  ws.on("message", async (data) => {
    const message = data.toString();

    if (message.includes("user.login")) {
      console.log(
        `[${getCurrentTime()}] [INFO] Handling 'user.login' event from WebSocket server`
      );
    }

    if (!message.includes("user.login")) {
      console.log(
        `[${getCurrentTime()}] [INFO] General WebSocket Message: ${message}`
      );
    }

    if (isJsonString(message)) {
      try {
        const result = JSON.parse(message);

        if (result.event === "user.login") {
          console.log(
            `[${getCurrentTime()}] [INFO] Handling 'user.login' event`
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
          error.message
        );
      }
    } else {
      console.error(
        `[${getCurrentTime()}] [ERROR] Incoming message is not valid JSON:`,
        message
      );
    }
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error(
      `[${getCurrentTime()}] [ERROR] WebSocket error: ${error.message}`
    );
  });

  // Handle WebSocket close event
  ws.on("close", () => {
    console.log(`[${getCurrentTime()}] [INFO] WebSocket connection closed`);
  });
}

// Utility function to check if a string is valid JSON
function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
