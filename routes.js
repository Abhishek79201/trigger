"use strict";

import { googleSheetHook } from "./googleSheetHook.js";

const Routes = [{ path: "/", router: googleSheetHook }];

Routes.init = (app) => {
  if (!app || !app.use) {
    console.error(
      "[Error] Route Initialization Failed: app / app.use is undefined"
    );
    return process.exit(1);
  }

  Routes.forEach((route) => app.use(route.path, route.router));

  // Unknown Routes
  app.use("*", (request, response, next) => {
    const error = {
      statusCode: 404,
      message: ["Cannot", request.method, request.originalUrl].join(" "),
    };
    next(error);
  });

  app.use((error, request, response, next) => {
    if (!error) {
      return;
    }

    if (error.statusCode) {
      response.statusMessage = error.message;
      return response.status(500).json({
        statusCode: error.statusCode,
        message: error.message,
      });
    }

    const err = {
      statusCode: 500,
      message: error.toString(),
    };
    response.statusMessage = err.message;
    return response.status(err.statusCode).json(err);
  });
};

export default Routes;
