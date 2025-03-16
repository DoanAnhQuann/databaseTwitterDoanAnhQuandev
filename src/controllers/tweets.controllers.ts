import { Request, Response, NextFunction } from 'express'
import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import { tweetService } from '~/services/tweets.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { TweetType } from '~/models/Orther'
export async function createTweetController(
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  res.json({ message: 'Create Tweet success', data: result })
  return
}

export async function getTweetController(req: Request, res: Response, next: NextFunction) {
  const result = await tweetService.increaseView(req.params.tweet_id, req.decoded_authorization)
  const tweet = (req as Request).tweet
  const newTweet = {
    ...tweet,
    user_views: result.user_views,
    guest_views: result.guest_views,
    updated_at: result.updated_at
  }
  res.json({ message: 'Get tweet success', result: newTweet })
  return
}

export async function getTweetChildrenController(req: Request, res: Response, next: NextFunction) {
  const tweet_type = Number(req.query.tweet_type as string)
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const user_id = req.decoded_authorization
  const {tweets, totalPages} = await tweetService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })
  res.json({ message: 'Get tweet children success', result: {
    tweets,
    tweet_type,
    limit,
    page,
    totalPages: Math.ceil(totalPages / limit)
  } })
  return
}

export async function getNewFeedsController(req: Request, res: Response, next: NextFunction) {
  const user_id = req.decoded_authorization.user_id as string
  const limit =  Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await tweetService.getNewFeeds({
    user_id,
   limit,
   page
  })
  res.json({
    message:"Get new feeds successfully",
    result : {
      tweets: result.tweets,
      limit,
      page,
      totalPages: Math.ceil(result.total / limit)
    }
  })
}