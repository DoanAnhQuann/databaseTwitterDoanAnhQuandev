import dotenv from 'dotenv'
import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
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

get users(): Collection<User> {
  return this.db.collection(process.env.DB_USER_COLLECTION as string);
}
}

export const databaseService = new DatabaseService()