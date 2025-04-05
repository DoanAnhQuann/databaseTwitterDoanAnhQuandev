import { Router } from "express";
import { searchController } from "~/controllers/searchs.controllers";
import { searchValidator } from "~/middlewares/search.middlewares";
import { paginationValidator } from "~/middlewares/tweets.middlewares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middleware";
import { wrapRequestHandler } from "~/utils/handlers";

export const searchRouter = Router()

/**
 * Search
 * 
 */
searchRouter.get('/',
  accessTokenValidator,
  verifiedUserValidator,
  searchValidator,
  paginationValidator,
  wrapRequestHandler(searchController)
)