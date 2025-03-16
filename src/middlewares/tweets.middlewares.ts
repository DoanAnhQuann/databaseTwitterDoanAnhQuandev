import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { ppid } from 'process'
import { MediasType, UserVerifyStatus } from '~/constants/enum'
import httpStatus from '~/constants/httpStatus'
import { Tweets_Message, usersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TweetAudience, TweetType } from '~/models/Orther'
import Tweet from '~/models/schemas/Tweets.schema'
import { databaseService } from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handlers'
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
          if (!value.every((item: any) => typeof item === 'string')) {
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
          if (
            !value.every((item: any) => {
              return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
            })
          ) {
            throw new Error(Tweets_Message.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

// Muốn sử dụng async await trong handler thì phải có try catch
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = (req as Request).tweet
  if (tweet!.audience === TweetAudience.TwitterCircle) {
    //Kiểm tra người dùng đăng nhập chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: usersMessages.ACCESS_TOKEN_IS_REQUIRED
      })
    }

    //Kiểm tra tác giả có bị khóa hay banned gì không

    const author_id = await databaseService.users.findOne({
      _id: new ObjectId(tweet?.user_id)
    })

    if (!author_id || author_id.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: usersMessages.USER_NOT_FOUND
      })
    }
    const { user_id } = req.decoded_authorization
    //Kiểm tra người xem tweet này có trong twitter circle của tác giả hay không
    const isInTwitterCircle = author_id.twitter_circles?.some((user_circle_id) => user_circle_id.equals(user_id))
    //Nếu không bạn không phải là tác giả và không nằm trong circle
    if(!isInTwitterCircle && !author_id._id.equals(user_id)) {
      throw new ErrorWithStatus({
        status: httpStatus.FORBIDDEN,
        message: "Tweet is not public"
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: Tweets_Message.INVALID_TYPE
      }
    },
 
  },['query'])
)


export const paginationValidator = validate(checkSchema({
  limit: {
    isNumeric: true,
    custom: {
      options: (value, { req }) => {
        const num = Number(value)
        if (num > 100 || num < 1) {
          throw new Error('1<= limit <= 100')
        }
        return true
      }
    }
  },
  page: {
    isNumeric: true,
    custom: {
      options: (value, { req }) => {
        const num = Number(value)
        if (num < 1) {
          throw new Error('Page number must be greater than 0')
        }
        return true
      }
    }
  }
},['query']))