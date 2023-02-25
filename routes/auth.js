const express = require("express");
const router = express.Router();
const db = require("../db/db");
const conversion = require("../db/data_conversion");

const jwt = require("jwt-simple");
const config = require("../config/config");

router.post("/login", (req, res, next) => {
  /* Authorization
    req.body:
      email: <str>,
      password: <str>
  */
  console.log("login req.body", req.body);
  var filter = {
    $or: [{username: req.body.email}, {email: req.body.email}],
  };
  var fields = {};

  // Стучимся в публичную БД
  db.get(db.users_database, db.users_collection, filter, fields)
    .then((user_results) => {
      console.log("user_results[0]", user_results[0]);
      if (user_results.length > 0) {
        let user = user_results[0];
        var filter = {["user_id"]: user._id};

        // Стучимся в приватную БД
        db.get(db.secure_database, db.secure_collection, filter, fields)
          .then((secure_results) => {
            console.log("secure_results[0]", secure_results[0]);
            if (
              conversion.isValidPassword(
                req.body.password,
                secure_results[0].password
              )
            ) {
              // Данные внутри токена
              let payload = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: secure_results[0].role,
              };
              let token = jwt.encode(payload, config.secret);
              console.log("login token", token);

              // req.session.user = {
              //   id: user._id,
              //   email: user.email,
              // };
              // req.session.isLogged = true;
              // req.session.save(); // Сохранение сессии в БД mongoStore
              // console.log('login req.session', req.session)

              res.json({
                token: token,
                email: user.filter_email,
                username: user.username,
                personal: user.personal,
                //user: payload
              });
            } else {
              const err = new Error("Не верный логин или пароль!");
              err.status = 401;
              next(err);
            }
          })
          .catch((err) => {
            next(err);
          });
      } else {
        const err = new Error("Не верный логин или пароль!");
        err.status = 401;
        next(err);
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/logout", (req, res, next) => {
  // console.log('logout req.session BEFORE', req.session)
  // req.session.isLogged = false;
  // if (req.session.user) delete req.session.user;
  res.json({msg: "logout succesfull"});
});

router.post("/signup", (req, res, next) => {
  /* Registration
    req.body:
      email: <str>,
      password: <str>,
      username: <str>,
  */

  console.log("signup req.body", req.body);

  var servertime = new Date().getTime();
  var filter_email = {email: req.body.email};
  var fields = {};
  db.get(db.users_database, db.users_collection, filter_email, fields)
    .then((results_email) => {
      var filter_username = {username: req.body.username};
      db.get(db.users_database, db.users_collection, filter_username, fields)
        .then((results_username) => {
          if (results_email.length) {
            res.status(400).json({
              message: "Пользователь с такой почтой уже существует!",
            });
          } else if (results_username.length) {
            res.status(400).json({
              message: "Пользователь с таким именем уже существует!",
            });
          } else {
            // === Личные данные пользователя ===
            let profile_data = {
              email: req.body.email,
              username: req.body.username,
            };
            // Записываем данные в БД usersdb
            db.create(db.users_database, db.users_collection, profile_data)
              .then((results) => {
                var new_user = results.ops[0];
                // console.log('new_user', new_user)

                let payload = {
                  id: new_user._id,
                  email: new_user.email,
                  username: new_user.username,
                  role: 0,
                };
                let token = jwt.encode(payload, config.secret);
                // req.session.user = { id: new_user._id, email: new_user.email };
                // req.session.save(); // Сохранение сессии в БД mongoStore
                // console.log('sess', req.session)

                // Собираем секретные данные для регистрации (пароль)
                let secure_data = {
                  user_id: new_user._id,
                  password: conversion.createHash(req.body.password),
                  role: 1,
                };
                // Записываем пароль в секретную БД securedb
                db.create(db.secure_database, db.secure_collection, secure_data)
                  .then((results) => {
                    res.json({
                      token: token,
                      email: new_user.email,
                      username: new_user.username,
                      personal: null,
                    });
                  })
                  .catch((err) => {
                    next(err);
                  });
              })
              .catch((err) => {
                next(err);
              });
          }
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
