import { Router } from "express";
import { staticSingleImage, staticSingleVideo } from "~/controllers/statics.controllers";
import { wrapRequestHandler } from "~/utils/handlers";

export const staticsRouter = Router()

staticsRouter.get('/image/:name', wrapRequestHandler(staticSingleImage))

staticsRouter.get('/video/:name', wrapRequestHandler(staticSingleVideo))