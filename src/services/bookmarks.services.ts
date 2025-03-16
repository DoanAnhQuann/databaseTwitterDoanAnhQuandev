import BookMarks from "~/models/schemas/BookMarks.schema";
import { databaseService } from "./database.services";
import { ObjectId } from "mongodb";

class BookmarksService {
  async bookmarkTweet(user_id: string, tweetId: string) {
   const tweet = await databaseService.bookmarks.findOne({
     tweet_id: new ObjectId(tweetId),
   })
   if(!Boolean(tweet)) {
    const result = await databaseService.bookmarks.insertOne(new BookMarks({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweetId),
      created_at: new Date(),
    }))
    return {  message: "Bookmark tweet success", _id:result.insertedId}
   }
   await databaseService.bookmarks.deleteOne({
     tweet_id: new ObjectId(tweetId),
   })
   return {
    message: "UnBookmarked Successfully"
   }
  }
}
export const bookmarksService = new BookmarksService();