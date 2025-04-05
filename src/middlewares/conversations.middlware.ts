import { checkSchema } from "express-validator";
import { validate } from "~/utils/validation";
import { followUserIdSchema } from "./users.middleware";

export const conversationValidator = validate(
  checkSchema({
    receiver_id: followUserIdSchema
},['params']))
