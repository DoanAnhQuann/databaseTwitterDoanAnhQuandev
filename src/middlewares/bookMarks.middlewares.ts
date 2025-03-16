import { options } from 'axios'
import { Request } from 'express'
import { check, checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import httpStatus from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import BookMarks from '~/models/schemas/BookMarks.schema'
import { databaseService } from '~/services/database.services'
import { validate } from '~/utils/validation'

export const bookMarkValidator = validate(
  checkSchema({
    tweet_id: {
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              message: 'Tweet id is not valid',
              status: httpStatus.BAD_REQUEST
            })
          }
          //  const tweet = await databaseService.tweets.findOne({_id: new ObjectId(value)})
          const [tweet] = await databaseService.tweets.aggregate([
            {
              $match: {
                _id: new ObjectId(value)
              }
            },
            {
              $lookup: {
                from: 'hashtags',
                localField: 'hashtags',
                foreignField: '_id',
                as: 'hashtags'
              }
            },
            {
              $addFields: {
                hashtags: {
                  $map: {
                    input: '$hashtags',
                    as: 'hashtag',
                    in: {
                      name: '$$hashtag.name',
                      created_at: '$$hashtag.created_at'
                    }
                  }
                }
              }
            },
            {
              $lookup: {
                from: 'tweets',
                localField: '_id',
                foreignField: 'parent_id',
                as: 'tweet_childrent'
              }
            },
            {
              $addFields: {
                retweet_count: {
                  $size: {
                    $filter: {
                      input: '$tweet_childrent',
                      as: 'item',
                      cond: {
                        $eq: ['$$item.type', 1]
                      }
                    }
                  }
                },
                comment_count: {
                  $size: {
                    $filter: {
                      input: '$tweet_childrent',
                      as: 'item',
                      cond: {
                        $eq: ['$$item.type', 2]
                      }
                    }
                  }
                },
                quote_count: {
                  $size: {
                    $filter: {
                      input: '$tweet_childrent',
                      as: 'item',
                      cond: {
                        $eq: ['$$item.type', 3]
                      }
                    }
                  }
                }
              }
            },
            {
              $project: {
                tweet_childrent: 0
              }
            }
          ]).toArray()
          if (!Boolean(tweet)) {
            throw new ErrorWithStatus({
              message: 'Tweet id not found',
              status: httpStatus.NOT_FOUND
            })
          }
          req.tweet = tweet
          return true
        }
      }
    }
  })
)
