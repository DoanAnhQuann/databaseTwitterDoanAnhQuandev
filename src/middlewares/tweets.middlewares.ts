import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediasType } from '~/constants/enum'
import { Tweets_Message } from '~/constants/messages'
import { TweetAudience, TweetType } from '~/models/Orther'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validation'
const tweetTypes = numberEnumToArray(TweetType)
const tweetTypeAudience = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediasType)
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: Tweets_Message.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetTypeAudience],
        errorMessage: Tweets_Message.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(Tweets_Message.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }

          // nếu `type` là tweet thì `parent_id` phải là `null`
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(Tweets_Message.PARENT_ID_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          // Nếu `type` tweet, comment, quotetweet và không có 'mentions' và hashtags thì `content` phải là `string` và không được rỗng
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error(Tweets_Message.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }

          //Nếu `type` retweet thì content phải là ''
          if (type === TweetType.Retweet && value !== '') {
            throw new Error(Tweets_Message.CONTENT_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là string
          if (!value.every((item: any) => typeof item ==='string')) {
            throw new Error(Tweets_Message.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là userId
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(Tweets_Message.MENTIONS_MUST_BE_AN_ARRAY_OF_USERID)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là Media Object
          if (!value.every((item: any) => {
            return typeof item.url !=='string' || !mediaTypes.includes(item.type)
          })) {
            throw new Error(Tweets_Message.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)
