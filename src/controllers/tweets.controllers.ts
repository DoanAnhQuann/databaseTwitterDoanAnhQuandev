import { Request, Response,NextFunction } from "express";
import { TweetRequestBody } from "~/models/requests/Tweet.requests";
import { ParamsDictionary } from 'express-serve-static-core'
export async function createTweetController( req: Request<ParamsDictionary, any , TweetRequestBody>,res: Response, next: NextFunction) {
  res.json({success: "success"})
  return
}