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

yargs(process.argv.slice(2))
  .command(
    "listen",
    "Start listening to a WebSocket server and forward events",
    (yargs) => {
      return yargs
        .option("url", {
          alias: "u",
          type: "string",
          demandOption: true,
          description:
            "WebSocket server URL, e.g., ws://labs.bsospace.com:3204",
        })
        .option("forward", {
          alias: "f",
          type: "string",
          demandOption: true,
          description:
            "Local URL to forward event data, e.g., http://localhost:5000",
        })
        .option("event", {
          alias: "e",
          type: "array",
          demandOption: true,
          description:
            "List of events to listen for, e.g., user.login order.created",
        })
        .option("token", {
          alias: "t",
          type: "string",
          demandOption: true,
          description: "Authentication token to send with the microservice URL",
        });
    },
    async (argv) => {
      const url: string = argv.url as string;
      const forwardUrl: string = argv.forward as string;
      const events: string[] = (argv.event as string[]).map((e) =>
        e.toString()
      );
      const token: string = argv.token as string;

      const ws = new WebSocket(url);

      function getCurrentTime(): string {
        return new Date().toISOString();
      }

      ws.on("open", () => {
        console.log(
          `[${getCurrentTime()}] [INFO] Connected to WebSocket server at ${url}`
        );

        const message = { token, microserviceUrl: forwardUrl };
        console.log(
          `[${getCurrentTime()}] [INFO] Sending connection message with token and microservice URL`
        );
        ws.send(JSON.stringify(message));
      });

      ws.on("message", async (data: WebSocket.Data) => {
        const message = data.toString();
        console.log(
          `[${getCurrentTime()}] [INFO] Received message: ${message}`
        );

        if (isJsonString(message)) {
          try {
            const result = JSON.parse(message);
            const payload = JSON.parse(result.payload);

            if (events.includes(payload.event)) {
              console.log(
                `[${getCurrentTime()}] [INFO] Handling '${payload.event}' event`
              );

              const res = await fetch(forwardUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-hook-token": result.token,
                  "x-hook-signature": result.signature,
                },
                body: JSON.stringify(payload),
              });

              const resData = await res.json();
              if (res.ok) {
                console.log(
                  `[${getCurrentTime()}] [INFO] Forwarded successfully`
                );
              } else {
                console.error(
                  `[${getCurrentTime()}] [ERROR] Error forwarding data:`,
                  resData
                );
              }
            } else {
              console.log(
                `[${getCurrentTime()}] [INFO] Ignored event '${payload.event}'`
              );
            }
          } catch (error) {
            console.error(
              `[${getCurrentTime()}] [ERROR] Failed to handle event:`,
              (error as Error).message
            );
          }
        } else {
          console.error(
            `[${getCurrentTime()}] [ERROR] Invalid JSON message: ${message}`
          );
        }
      });

      ws.on("error", (error: Error) => {
        console.error(
          `[${getCurrentTime()}] [ERROR] WebSocket error: ${error.message}`
        );
      });

      ws.on("close", () => {
        console.log(`[${getCurrentTime()}] [INFO] WebSocket connection closed`);
      });

      function isJsonString(str: string): boolean {
        try {
          JSON.parse(str);
          return true;
        } catch {
          return false;
        }
      }
    }
  )
  .help()
  .alias("help", "h")
  .demandCommand(1, "You need to specify a command.").argv;
