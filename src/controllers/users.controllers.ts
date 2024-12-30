import { NextFunction, Request, Response } from "express";
import { usersService } from "~/services/users.services";
import {ParamsDictionary} from "express-serve-static-core"
import { RegisterRequestBody } from "~/models/requests/User.requests";
export async function registerController( req :Request<ParamsDictionary, any, RegisterRequestBody>, res: Response, next: NextFunction) {
  // throw new Error("lỗi rồi")
   const result = await usersService.register(req.body)
   res.json({success: true, message:'Success', data: result})
   return
}