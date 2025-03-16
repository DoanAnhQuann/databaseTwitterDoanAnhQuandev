import { TweetRequestBody } from '~/models/requests/Tweet.requests'
import { databaseService } from './database.services'
import Tweet from '~/models/schemas/Tweets.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtags.schema'
import { StringChain } from 'lodash'
import { TweetType } from '~/models/Orther'

class TweetsService {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtag trong database, nếu có thì lấy không thì tạo mới
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            //trả về kết quả sau khi cập nhât
            returnDocument: 'after'
          }
        )
      })
    )
    return hashtagDocuments.map((hashtag) => hashtag?._id)
  }
  async createTweet(body: TweetRequestBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)
    console.log(hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashtags as ObjectId[],
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async increaseView(tweet_id: string, user_id: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const tweet = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )
    return tweet as WithId<{
      guest_views: number
      user_views: number
      updated_at: Date
    }>
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id?: string
  }) {
    console.log(tweet_id, tweet_type, limit, page)
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
                    $eq: ['$$item.type', TweetType.Retweet]
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
                    $eq: ['$$item.type', TweetType.Comment]
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
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $skip: limit * (page - 1) // công thức phân trang
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    await databaseService.tweets.updateMany(
      {
        //Tìm những thằng có id nằm trong id có array như trên dùng $in
        _id: { $in: ids }
      },
      {
        $inc: inc,
        $set: {
          updated_at: date
        }
      }
    )
    const totalPages = await databaseService.tweets.countDocuments({
      parent_id: new ObjectId(tweet_id),
      type: tweet_type
    })
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      tweets,
      totalPages
    }
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj =  new ObjectId(user_id)
    const followed_user_id = await databaseService.followers
      .find(
        {
          user_id: new ObjectId(user_id)
        },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()
    const ids = followed_user_id.map((item) => item.followed_user_id)
    //Mong muốn new feeds lấy cả bài tweet của chính bản thân
    ids.push(new ObjectId(user_id))

    const tweets = await databaseService.tweets.aggregate([
      {
        $match: {
          user_id: {
            $in: ids
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          $or: [
            {
              audience: 0
            },
            {
              $and: [
                {
                  audience: 1
                },
                {
                  'user.twitter_circles': {
                    $in: [new ObjectId(user_id)]
                  }
                }
              ]
            }
          ]
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
                  $eq: ['$$item.type', TweetType.Retweet]
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
                  $eq: ['$$item.type', TweetType.Comment]
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
                  $eq: ['$$item.type', TweetType.QuoteTweet]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          tweet_childrent: 0,
          user: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            twitter_circles: 0
          }
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      },
      {
        $skip: limit *(page -1)
      },
      {
        $limit: limit
      }
    ]).toArray()
    const tweet_id = tweets.map((tweet) => tweet._id)
    const date = new Date()
    await databaseService.tweets.updateMany(
      {
        //Tìm những thằng có id nằm trong id có array như trên dùng $in
        _id: { $in: tweet_id }
      },
      {
        $inc: {user_views: 1},
        $set: {
          updated_at: date
        }
      }
    )
    const totalPages = await databaseService.tweets.aggregate(
      [
        {
          $match: {
            user_id: {
              $in: ids
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.twitter_circles': {
                      $in: [new ObjectId(user_id)]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $count: 'total'
        }
      ]
    ).toArray();

    tweets.forEach((tweet) => {
      tweet.updated_at = date
      tweet.user_views += 1
    })
    return {
      tweets,
      total: totalPages[0].total
    }
  }
}

export const tweetService = new TweetsService()
