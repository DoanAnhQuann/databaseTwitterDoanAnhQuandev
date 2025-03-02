import { Request, Response,NextFunction } from "express";
import { TweetRequestBody } from "~/models/requests/Tweet.requests";
import { ParamsDictionary } from 'express-serve-static-core'
import { tweetService } from "~/services/tweets.services";
import { TokenPayload } from "~/models/requests/User.requests";
export async function createTweetController( req: Request<ParamsDictionary, any , TweetRequestBody>,res: Response, next: NextFunction) {
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  res.json({message: "Create Tweet success", data: result})
  return
}