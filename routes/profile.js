const express = require("express");
const router = express.Router();
const jwt = require("jwt-simple");

const db = require("../db/db");
const config = require("../config/config");

// Get existed user
router.post("/get", async (req, res, next) => {
  console.log(
    "GET  req.body",
    req.body,
    db.users_database,
    db.users_collection
  );

  var token_data = jwt.decode(req.headers.auth, config.secret, false, "HS256");
  var filter = {email: token_data.email};
  var fields = !!req.body.url ? {[req.body.url]: 1} : {};

  return new Promise((resolve, reject) => {
    db.get(db.users_database, db.users_collection, filter, fields)
      .then((results) => {
        console.log("GET  results", results);

        // Достаём по url нужное вложенное поле из результата
        let results_found_field = results[0];
        let urls;

        // Проход по объекту юзера поиска нужного поля
        if (results_found_field) {
          if (!!req.body.url) {
            fields = {[req.body.url]: 1};
            if (req.body.url.length > 0) {
              urls = req.body.url.split(".");
              for (i in urls) {
                if (results_found_field[urls[i]] != undefined)
                  results_found_field = results_found_field[urls[i]];
              }
            }
          }
          console.log("GET  ans", results_found_field);
          resolve(results_found_field);
        } else {
          resolve(null);
        }
      })
      .catch(next);
  });
});

router.post("/update", async (req, res, next) => {
  console.log("UPDATE  req.body", req.body);

  var token_data = jwt.decode(req.headers.auth, config.secret, false, "HS256");

  var filter = {email: token_data.email};
  var update_fields = null;
  var get_fields = null;

  return new Promise((resolve, reject) => {
    if (!!req.body.url) {
      update_fields = {[req.body.url]: req.body.value};
      get_fields = {[req.body.url]: 1};
    } else {
      const err = new Error("Фильтр данных не задан");
      next(err);
    }

    db.get(db.users_database, db.users_collection, filter, get_fields)
      .then(async (get_results) => {
        // console.log('UPDATE  get_results', get_results)

        // Достаём нужное поле по URL
        let urls = req.body.url.split(".");
        let get_result_field = get_results[0];
        if (get_results.length > 0)
          for (i in urls) {
            if (get_result_field != undefined) {
              get_result_field = get_result_field[urls[i]];
            }
          }
        // console.log('UPDATE  get_result_field', get_result_field)

        // Если поле найдено, то обновляем его
        if (!!get_result_field) {
          db.update(
            db.users_database,
            db.users_collection,
            filter,
            update_fields
          )
            .then((results) => {
              if (!!results) {
                resolve();
              } else {
                const err = new Error("Данные не обновлены!");
                err.status = 400;
                next(err);
              }
            })
            .catch(next);
        }

        // Если такого объекта или поля в базе нет, то создаём его
        else {
          db.update(
            db.users_database,
            db.users_collection,
            filter,
            update_fields
          )
            .then((results) => {
              if (!!results) {
                resolve();
              } else {
                const err = new Error("Данные не обновлены!");
                err.status = 400;
                next(err);
              }
            })
            .catch(next);
        }
      })
      .catch(next);
  });
});

module.exports = router;
