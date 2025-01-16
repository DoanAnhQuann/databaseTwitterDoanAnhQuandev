import { ObjectId } from "mongodb";

interface IFollowUser {
  _id?: ObjectId
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at?: Date
}

export default class FollowUser {
  _id?: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at?: Date;
  constructor(follow: IFollowUser) {
    const date = new Date();
    this._id = follow._id || new ObjectId
    this.user_id = follow.user_id 
    this.followed_user_id = follow.followed_user_id 
    this.created_at = follow.created_at || date;
  }
}

