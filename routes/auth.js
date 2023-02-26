const express = require("express");
const router = express.Router();
const jwt = require("jwt-simple");

const db = require("../db/db");
const conversion = require("../db/data_conversion");
const config = require("../config/config");

router.post("/signin", (req, res, next) => {
  /* Authorization
    req.body:
      email: <str>,
      password: <str>
  */
  console.log("login req.body", req.body);

  var filter = {
    $or: [{username: req.body.email}, {email: req.body.email}],
  };
  var fields = {
    _id: 0,
  };

  // Стучимся в публичную БД
  db.get(db.users_database, db.users_collection, filter, fields)
    .then((user_results) => {
      if (user_results.length > 0) {
        const user = user_results[0];
        console.log("user", user);
        if (conversion.isValidPassword(req.body.password, user.password)) {
          // Данные внутри токена
          delete user.password;
          let account = {...user};
          const token = jwt.encode(account, config.secret);
          console.log("login token", token);

          res.json({
            token: token,
            account: account,
          });
        } else {
          const err = new Error("Не верный логин или пароль!");
          err.status = 401;
          next(err);
        }
      }
    })
    .catch(next);
});

router.post("/logout", (req, res, next) => {
  // console.log('logout req.session BEFORE', req.session)
  res.json({msg: "logout succesfull"});
});

router.post("/signup", async (req, res, next) => {
  /* Registration
    req.body:
      email: <str>,
      password: <str>,
      username: <str>,
      avatar: <str>,
      birthday: <str>,
  */

  console.log("signup req.body", req.body);

  var fields = {};

  const userListSameEmail = await db.get(
    db.users_database,
    db.users_collection,
    {email: req.body.email},
    fields
  );
  const userListSameUsername = await db.get(
    db.users_database,
    db.users_collection,
    {username: req.body.username},
    fields
  );

  if (userListSameEmail.length) {
    const err = new Error("Пользователь с такой почтой уже существует!");
    err.status = 401;
    next(err);
  } else if (userListSameUsername.length) {
    const err = new Error("Пользователь с таким именем уже существует!");
    err.status = 401;
    next(err);
  } else {
    let profile_data = {
      ...req.body,
      password: conversion.createHash(req.body.password),
    };
    // Записываем данные в БД usersdb
    db.create(db.users_database, db.users_collection, profile_data)
      .then((results) => {
        res.json({});
      })
      .catch(next);
  }
});

module.exports = router;
