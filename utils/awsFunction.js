require("express");
require("dotenv").config();
// Multer for Image Upload
const multer = require("multer");
const multerS3 = require("multer-s3");
// AWS
const aws = require("aws-sdk");

const { ACCESS_KEY, ACCESS_SECRET, REGION, AWS_BUCKET } = process.env;

const s3Config = new aws.S3({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: ACCESS_SECRET,
  region: REGION,
});

const pictureS3Config = multerS3({
  s3: s3Config,
  bucket: AWS_BUCKET,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, "banker-logo/" + file.originalname);
  },
});

exports.uploadPicture = multer({
  storage: pictureS3Config,
  limits: {
    fileSize: 1024 * 1024 * 5,
    // here 5 means 5mb image size
    // If needed... We can change the image size
  },
});

const fileS3Config = multerS3({
  s3: s3Config,
  bucket: AWS_BUCKET,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, "documents/" + file.originalname);
  },
});

exports.uploadFiles = multer({
  storage: fileS3Config,
  limits: {
    fileSize: 1024 * 1024 * 5,
    // here 5 means 5mb file size
    // If needed... We can change the file size
  },
});
