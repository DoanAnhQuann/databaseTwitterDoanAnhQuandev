import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "~/models/requests/User.requests";
import { bookmarksService } from "~/services/bookmarks.services";

 export async function bookmarksController(req: Request, res: Response, next: NextFunction){
  const {user_id} = req.decoded_authorization as TokenPayload
  const result = await bookmarksService.bookmarkTweet(user_id, req.body.tweet_id)
  res.json(result)
  return
 }