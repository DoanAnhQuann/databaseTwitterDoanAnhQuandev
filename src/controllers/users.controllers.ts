import { NextFunction, Request, Response } from "express";
import { usersService } from "~/services/users.services";
import {ParamsDictionary} from "express-serve-static-core"
import { LoginReqBody, LogoutReqBody, RegisterRequestBody } from "~/models/requests/User.requests";
import User from "~/models/schemas/User.schema";
import { ObjectId } from "mongodb";
import { usersMessages } from "~/constants/messages";
export async function registerController( req :Request<ParamsDictionary, any, RegisterRequestBody>, res: Response, next: NextFunction) {
  // throw new Error("lỗi rồi")
   const result = await usersService.register(req.body)
   res.json({success: true, message:usersMessages.REGISTER_SUCCESS, data: result})
   return
}

export async function loginController(req :Request<ParamsDictionary, any, LoginReqBody>, res: Response, next: NextFunction) {
  const  user  = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())
  res.json({success: true, message:usersMessages.LOGIN_SUCCESS, data: result})
  return
}

export async function logoutController(req: Request<ParamsDictionary, any, LogoutReqBody> ,res: Response,  next: NextFunction) {
  const {refresh_token} = req.body
  const result = await usersService.logout(refresh_token)
  res.json(result)
  return
}