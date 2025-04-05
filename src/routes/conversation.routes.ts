import { Router } from "express";
import { conversationController } from "~/controllers/conversations.controllers";
import { conversationValidator } from "~/middlewares/conversations.middlware";
import { paginationValidator } from "~/middlewares/tweets.middlewares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middleware";
import { wrapRequestHandler } from "~/utils/handlers";

export const conversationRoutes = Router()

conversationRoutes.get(
  '/receiver/:receiverId',
  accessTokenValidator,
  verifiedUserValidator,
  // conversationValidator,
  paginationValidator,
  wrapRequestHandler(conversationController)
)