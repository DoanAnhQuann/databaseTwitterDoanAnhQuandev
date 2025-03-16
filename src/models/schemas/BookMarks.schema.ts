import { ObjectId } from "mongodb";

interface BookMarkType {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at: Date
}
export default class BookMarks {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
  constructor({_id, user_id, tweet_id, created_at}:BookMarkType){
    this._id = _id 
    this.user_id = user_id
    this.tweet_id = tweet_id
    this.created_at = created_at || new Date()
  }
}
