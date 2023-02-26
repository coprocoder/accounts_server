const express = require("express");
const router = express.Router();

const db = require("../db/db");

router.get("/", async (req, res, next) => {
  var filter = {};
  var fields = {_id: 0, username: 1, birthday: 1, avatar: 1};

  return db
    .get(db.users_database, db.users_collection, filter, fields)
    .then((results) => {
      console.log("PEOPLE GET res", results);
      res.send(results);
    })
    .catch(next);
});

// router.post("/find", (req, res, next) => {
//   /*
//     req.body ex: {
//       "value": <find str>, // ex: Fam Nam Otch
//     }
//   */

//   console.log("find user GET CUR req.body", req.body);

//   let target_path_list = ["username"];
//   let target_words = req.body.value.toLowerCase().split(" ");
//   let query_fields = [];
//   for (let word in target_words) {
//     let filter_fields = [];
//     for (let field in target_path_list)
//       filter_fields.push({
//         [target_path_list[field]]: {
//           $regex: target_words[word],
//           $options: "-i",
//         },
//       });
//     query_fields.push({$or: filter_fields});
//   }
//   // console.log('find user GET CUR query_fields', query_fields)

//   var filter = {$and: query_fields};
//   var fields = {
//     email: 1,
//     username: 1,
//     personal: 1,
//   };

//   // console.log('find user GET CUR filter', filter)

//   db.get(db.users_database, db.users_collection, filter, fields)
//     .then((results) => {
//       // console.log('find user GET CUR results', results)
//       // console.log('unwrap', unwrap(results[0]))
//       if (results.length) res.send(results);
//       else res.send({});
//     })
//     .catch((err) => {
//       next(err);
//     });
// });

module.exports = router;
