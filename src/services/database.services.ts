import dotenv from 'dotenv'
import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import FollowUser from '~/models/schemas/FollowUsers.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
dotenv.config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.a1ipw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

class DatabaseService {
  private client: MongoClient;
  private db: Db
  constructor() {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    this.db = this.client.db(`${process.env.DB_NAME}`);
}
async connect() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await this.client.connect();
    // Send a ping to confirm a successful connection
    await this.db.command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    // Ensures that the client will close when you finish/error
    // await this.client.close();
    console.error("Error connecting to MongoDB", error);
    throw error;
  }

}

 async indexUser() {
  const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])
  if (!exists) {
    this.users.createIndex({ email: 1, password: 1 })
    this.users.createIndex({ email: 1 }, { unique: true })
    this.users.createIndex({ username: 1 }, { unique: true })
  }
}
async indexRefreshToken() {
  const exists = await this.refreshToken.indexExists(['exp_1', 'token_1'])
  if (!exists) {
  this.refreshToken.createIndex({token: 1})
  this.refreshToken.createIndex({exp: 1}, {expireAfterSeconds: 0})
  }
}
 async indexFollower() {
  const exists = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
  if(!exists) {
  this.followers.createIndex({user_id: 1, followed_user_id: 1}, {unique: true})
  }  
}
get users(): Collection<User> {
  return this.db.collection(process.env.DB_USER_COLLECTION as string);
}

get refreshToken(): Collection<RefreshToken> {
  return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string);
}

get followers(): Collection<FollowUser> {
  return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string);
}
}

export const databaseService = new DatabaseService()