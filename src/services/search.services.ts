import { SearchQuery } from '~/models/requests/Search.requests'
import { databaseService } from './database.services'
import { ObjectId } from 'mongodb'
import { MediasType, MediaTypeQuery, PeopleFollow } from '~/constants/enum'

class SearchService {
  async search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number
    page: number
    content: string
    user_id: string
    media_type?: MediaTypeQuery
    people_follow?: PeopleFollow
  }) {
    try {
      // Kiểm tra nếu content trống, tránh lỗi truy vấn MongoDB
      if (!content.trim()) {
        return []
      }
      const $match: any = {
        $text: {
          $search: content
        }
      }
      if (media_type) {
        if (media_type === MediaTypeQuery.Image) {
          $match['medias.type'] = MediasType.Image
        } else if (media_type === MediaTypeQuery.Video) {
          $match['medias.type'] = MediasType.Video
        }
      }
      if(people_follow && people_follow === PeopleFollow.Following){
        const user_id_obj =  new ObjectId(user_id)
        console.log(user_id_obj)
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
        ids.push(user_id_obj)
        $match['user_id'] = {
          $in: ids
        }
      }
      const tweets = await databaseService.tweets
        .aggregate([
          {
            $match
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
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray()

      const tweet_id = tweets.map((tweet) => tweet._id)
      const date = new Date()
      await databaseService.tweets.updateMany(
        {
          //Tìm những thằng có id nằm trong id có array như trên dùng $in
          _id: { $in: tweet_id }
        },
        {
          $inc: { user_views: 1 },
          $set: {
            updated_at: date
          }
        }
      )
      const totalPages = await databaseService.tweets
        .aggregate([
          {
            $match
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
        ])
        .toArray()

      tweets.forEach((tweet) => {
        tweet.updated_at = date
        tweet.user_views += 1
      })
      return {
        tweets: tweets as Document[],
        total: totalPages[0] ? totalPages[0].total : 0
      }
    } catch (error) {
      console.error('Search error:', error)
      throw new Error('Search failed')
    }
  }
}

export const searchService = new SearchService()
