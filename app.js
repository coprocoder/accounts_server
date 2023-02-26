const createError = require("http-errors");
const cors = require("cors");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cons = require("consolidate");
const mimetypes = require("./config/mimetypes.js");

//### Mongo sessions
// const mongoose = require("mongoose")
// const session = require("express-session");
// const MongoStore = require("connect-mongo")(session);

var app = express();
app.use(cors());
app.options("*", cors());

//### view engine setup
app.engine("html", cons.swig);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

app.use(logger("dev"));

//### req.body parse
app.use(express.urlencoded({limit: "10mb", extended: true})); // for parsing application/x-   www-form-urlencoded
app.use(express.json({limit: "10mb", extended: true})); // for parsing application/json

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//### Logging of visits
app.use(function (req, res, next) {
  let now = new Date();

  let date = now.toISOString().slice(0, 10);
  let year = date.slice(0, 4);
  let month = date.slice(6, 7);
  let day = date.slice(9, 10);

  let hour = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  let data = `${day}.${month}.${year} ${hour}:${minutes}:${seconds} ${
    req.method
  } ${res.statusCode} ${req.url} ${req.get("user-agent")}`;
  fs.appendFile("requests.log", data + "\n", function () {});
  next();
});

// TODO: CDN via proxy Nginx & FTP
//### Проверка URL по его окончанию. Если файл, то вернуть его, иначе перейти по маршруту
app.use("/api", function (req, res, next) {
  var filePath = "." + req.url;
  var extname = path.extname(filePath);
  var contentType = mimetypes[extname];

  if (!!contentType) {
    filePath = path.join(__dirname, filePath);
    res.sendFile(filePath);
  } else next();
});

//### Routers Files
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const filesRouter = require("./routes/files");
const accountRouter = require("./routes/account");

//### Routes
app.use("/api/auth", authRouter); // Авторизация/регистрация
app.use("/api/people", usersRouter); // Все пользователи
app.use("/api/files", filesRouter); // Up/Download files
app.use("/api/account", accountRouter); // Текущий пользователь

/* ### === Error handlers block === */

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (err.code != "ERR_HTTP_HEADERS_SENT") console.log("=== ERROR", err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).send({code: err.status, message: err.message});
});

module.exports = app;
