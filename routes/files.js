const express = require("express");
const router = express.Router();

// For up/download files
var multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const {promisify} = require("util");
const sizeOf = promisify(require("image-size"));
const conversion = require("../db/data_conversion");

/* === IMAGES === */
function createHashedFilename(filename) {
  console.log("createHashedFilename", filename);
  // Расширение файла (всё, что после последней точки в названии)
  let file_ext = filename.split(".");
  file_ext = file_ext[file_ext.length - 1];

  let filename_hash = conversion.createHash(filename) + "." + file_ext;
  // console.log("hashed_filename", filename_hash);

  return filename_hash.replace("/", "").replace("\\", "");
}

async function generateAndSaveThumbnail(file, filename_hash) {
  console.log("file", file);

  let full_abs_path = path.resolve(file.path);

  let resize_rel_path = path.join(
    file.destination,
    "../thumbnail",
    filename_hash
  );
  let resize_abs_path = path.resolve(resize_rel_path);

  // Добавляем в ответ путь к resize img
  file["thumbnail"] = resize_rel_path;

  // Вычисление размеров миниатюры
  await sizeOf(full_abs_path)
    .then(async (dimensions) => {
      console.log("dimensions", dimensions);

      let new_h, new_w;
      let max_size = 200; // height or width
      if (dimensions.width > dimensions.height) {
        new_w = max_size;
        new_h = dimensions.height * (max_size / dimensions.width);
      } else {
        new_w = dimensions.width * (max_size / dimensions.height);
        new_h = max_size;
      }
      // console.log("new_size", { new_w, new_h });

      // Сжатие картинки до нужных размеров
      await sharp(full_abs_path)
        .resize(Math.ceil(new_w), Math.ceil(new_h))
        .jpeg({quality: 90})
        .toFile(resize_abs_path);
    })
    .catch((err) => console.error(err));

  return file;
}

// Генерируем миниатюры
async function generateMiniatures(files) {
  const promises = files.map((file, index) => {
    generateAndSaveThumbnail(file, filenames_lish_hashnames[index]);
  });
  await Promise.all(promises);
  filenames_lish_hashnames = [];
  return files;
}

let filenames_lish_hashnames = [];
var storage_img = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploadStorage/images/full");
  },
  filename: function (req, file, cb) {
    // Хешируем имена файлов и складываем в массив для генерации миниатюр
    let filename_hash = createHashedFilename(file.originalname);
    filenames_lish_hashnames.push(filename_hash);
    cb(null, filename_hash);
  },
});
var uploadImg = multer({storage: storage_img});

router.post("/upload_img", uploadImg.array("image"), async (req, res, next) => {
  console.log("upload_img", req.files);
  console.log("filenames_lish_hashnames", filenames_lish_hashnames);
  const filesWithThumbs = await generateMiniatures(req.files);
  console.log({filesWithThumbs});
  res.status(200).send(filesWithThumbs);
});

module.exports = router;
