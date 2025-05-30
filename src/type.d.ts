import Tweet from "./models/schemas/Tweets.schema"
import User from "./models/schemas/User.schema"
import {Request} from "express"

declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    tweet?: Tweet
  }
}