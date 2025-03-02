import { MediasType } from "~/constants/enum";

export type Media = {
  url: string
  type: MediasType
}

export enum TweetType {
  Tweet, Retweet,Comment, QuoteTweet
}

export enum TweetAudience {
  Everyone, TwitterCircle
}