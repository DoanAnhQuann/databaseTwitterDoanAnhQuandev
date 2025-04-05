import { ObjectId } from 'mongodb'
import { databaseService } from './database.services'

class ConversationService {
  async getConversationsWithReceiver({
    user_id,
    receiverId,
    limit,
    page
  }: {
    user_id: string
    receiverId: string
    limit: number
    page: number
  }) {
    const conversations = await databaseService.conversations
      .find({
        $or: [
          { sender_id: new ObjectId(user_id), receiver_id: new ObjectId(receiverId) },
          { sender_id: new ObjectId(receiverId), receiver_id: new ObjectId(user_id) }
        ]
      })
      .sort({ created_at: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()

      const total = await databaseService.conversations.countDocuments({
        $or: [
          { sender_id: new ObjectId(user_id), receiver_id: new ObjectId(receiverId) },
          { sender_id: new ObjectId(receiverId), receiver_id: new ObjectId(user_id) }
        ]
      })
    return {
      conversations,
      total:  Math.ceil(total / limit)
    }
  }
}

export const conversationService = new ConversationService()
