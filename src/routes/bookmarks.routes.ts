import { Router } from "express";
import { bookmarksController } from "~/controllers/bookmarks.controllers";
import { bookMarkValidator } from "~/middlewares/bookMarks.middlewares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middleware";
import { wrapRequestHandler } from "~/utils/handlers";

export const bookmarkRouter = Router()

/**
 * Bookmarks 
 * 
 */
bookmarkRouter.post('/', accessTokenValidator,bookMarkValidator, verifiedUserValidator, wrapRequestHandler(bookmarksController))