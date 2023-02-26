const express = require("express");
const router = express.Router();
const jwt = require("jwt-simple");

const db = require("../db/db");
const conversion = require("../db/data_conversion");
const config = require("../config/config");

router.get("/", async (req, res, next) => {
  console.log("GET  req.body", req.body);

  var token_data = jwt.decode(req.headers.auth, config.secret, false, "HS256");
  var filter = {email: token_data.email};
  var fields = {_id: 0, password: 0};

  return db
    .get(db.users_database, db.users_collection, filter, fields)
    .then((results) => {
      console.log("GET  results", results);
      res.send(results[0]);
    })
    .catch(next);
});

router.put("/", async (req, res, next) => {
  console.log("UPDATE  req.body", req.body);

  var token_data = jwt.decode(req.headers.auth, config.secret, false, "HS256");

  var filter = {email: token_data.email};
  let update_fields = {};
  Object.keys(req.body).map((x) => {
    if (x == "password") {
      update_fields.password = {
        $literal: conversion.createHash(req.body.password),
      };
    } else {
      update_fields[x] = req.body[x];
    }
  });

  return db
    .update(db.users_database, db.users_collection, filter, update_fields)
    .then((results) => {
      if (results.result.ok) {
        res.send();
      } else {
        const err = new Error("Данные не обновлены!");
        err.status = 400;
        next(err);
      }
    })
    .catch(next);
});

module.exports = router;
