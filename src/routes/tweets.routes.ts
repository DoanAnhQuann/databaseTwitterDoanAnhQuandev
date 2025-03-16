import { Router } from 'express'
import { createTweetController, getNewFeedsController, getTweetChildrenController, getTweetController } from '~/controllers/tweets.controllers'
import { bookMarkValidator } from '~/middlewares/bookMarks.middlewares'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description : Create tweet
 * Path : /
 * Method : POST
 * Body : TweetRequestBody
 */

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description : get tweet detail
 * Path : /:tweet_id
 * Method : GET
 * HEADERS :ACCESSTOKEN
 */

tweetsRouter.get(
  '/:tweet_id',
  bookMarkValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description : get tweet children
 * Path : /
 * Method : GET
 * HEADERS :ACCESSTOKEN
 * query : {limit: number , page: number, tweet_type: TweetType}
 */

tweetsRouter.get(
  '/:tweet_id/children',
  bookMarkValidator,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

/**
 * Description : get new feed
 * Path : /new-feeds
 * Method : GET
 * HEADERS :ACCESSTOKEN
 * query : {limit: number , page: number}
 */

tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)
export default tweetsRouter
