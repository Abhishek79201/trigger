"use strict";

import Express from "express";
import Routes from "./routes.js";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import { sequelize } from "./config.js";
import dotenv from "dotenv";
dotenv.config();
const App = new Express();
const corsOptions = { origin: "*" };
App.disable("etag");
App.use(cors(corsOptions));
App.use(compression());

App.use(bodyParser.json({ limit: "50mb" }));
App.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
App.use(bodyParser.json());
App.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Type", "application/json");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

Routes.init(App);

const syncModels = async () => {
  try {
    await sequelize.sync(); // This will create tables if they don't exist
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing models:", error);
  }
};
App.listen(8000, function () {
  console.log("server is running on port " + 8000);
});
syncModels();
