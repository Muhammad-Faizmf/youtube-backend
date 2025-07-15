const express = require("express");
const cors = require("cors");
var cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer();

const app = express();

// This will parse multipart/form-data without files
app.use(upload.none());

// Convert [Object: null prototype] to a plain object
app.use((req, res, next) => {
  if (req.body && Object.getPrototypeOf(req.body) === null) {
    req.body = { ...req.body }; // OR: Object.assign({}, req.body)
  }
  next();
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

module.exports = { app };
