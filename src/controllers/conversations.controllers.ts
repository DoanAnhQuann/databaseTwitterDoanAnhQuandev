import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "~/models/requests/User.requests";
import { conversationService } from "~/services/conversations.services";

export async function conversationController (req: Request, res: Response, next: NextFunction) {
   const { user_id } = req.decoded_authorization as TokenPayload
   const {receiverId} = req.params;
   const {limit, page} = req.query
   const result = await conversationService.getConversationsWithReceiver({user_id, receiverId, limit:Number(limit), page: Number(page)})
  
  res.json({ 
    message: 'Get Conversation Successfully',
    result:{
      conversation: result.conversations,
      limit: Number(limit),
      page: Number(page),
      totalPages: result.total
    } ,
  });
  return;
}