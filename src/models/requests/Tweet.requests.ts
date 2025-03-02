import { Media, TweetAudience, TweetType } from "../Orther";

export interface TweetRequestBody {
  type: TweetType,
  audience: TweetAudience,
  content: string,
  parent_id: string | null,
  hashtags: string[],
  mentions: string[],
  medias: Media[]
}