#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require("./app");
const debug = require("debug")("node-test:server");
const http = require("http");
const config = require("./config/config.json");

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "5001");

// Задаём параметры подключения к БД
const MongoClient = require("mongodb").MongoClient;
const url_db = config.db;
const mongoClient = new MongoClient(url_db, {useUnifiedTopology: true});

mongoClient.connect(function (err, client) {
  if (err) return console.log(err);

  // Открываем соединение с БД
  dbClient = client;

  app.set("port", port);
  const server = http.createServer(app);

  server.listen(port, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", port);
  });

  server.on("error", function (error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
      default:
        throw error;
    }
  });

  server.on("listening", function () {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Listening on " + bind);
  });
});

process.on("SIGINT", () => {
  dbClient.close(); // Закрываем соединение с БД
  console.log("=== SERVER STOPPED BY USER ===");
  process.exit(); // Останавливаем сервер
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
