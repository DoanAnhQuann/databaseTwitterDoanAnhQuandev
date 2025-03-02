import { NextFunction, Request, Response } from 'express'
import dotenv from 'dotenv'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterRequestBody,
  TokenPayload,
  UpdateProfileReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import { usersMessages } from '~/constants/messages'
import { databaseService } from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import httpStatus from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enum'
import { usersService } from '~/services/users.services'
import { pick } from 'lodash'
dotenv.config()
export async function registerController(
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) {
  // throw new Error("lỗi rồi")
  const result = await usersService.register(req.body)
  res.json({ success: true, message: usersMessages.REGISTER_SUCCESS, data: result })
  return
}

export async function loginController(
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response,
  next: NextFunction
) {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const verify = user.verify
  const result = await usersService.login({ user_id: user_id.toString(), verify: verify })
  res.json({ success: true, message: usersMessages.LOGIN_SUCCESS, data: result })
  return
}

export async function oauthController(req: Request, res: Response, next: NextFunction) {
  const { code } = req.query
  const result = await usersService.oauth(code as string)
  // res.json({ success: true, message: result.newUser ? usersMessages.REGISTER_SUCCESS : usersMessages.LOGIN_SUCCESS ,  })
  const urlRedirect = `${process.env.CLIENT_REDIRECT_URI}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  console.log(urlRedirect)
  res.redirect(urlRedirect)
  return
}

export async function logoutController(
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction
) {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  res.json(result)
  return
}

export async function emailVerifyController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  // Nếu ko tìm thấy user
  if (!user) {
    throw new ErrorWithStatus({
      message: usersMessages.USER_NOT_FOUND,
      status: httpStatus.NOT_FOUND
    })
  }
  // Đã verify rồi thì ko lỗi => trả về status 200 và message đã verify
  if (user.email_verify_token === '') {
    res.json({
      message: usersMessages.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const result = await usersService.verifyEmail(user_id)
  res.json({
    message: usersMessages.EMAIL_VERIFY_SUCCESS,
    result
  })
  return
}

export async function resendVerifyEmailController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    res.status(httpStatus.NOT_FOUND).json({
      message: usersMessages.USER_NOT_FOUND
    })
    return
  }
  if (user?.verify === UserVerifyStatus.Verified) {
    res.status(200).json({
      message: usersMessages.EMAIL_ALREADY_VERIFIED_BEFORE
    })
    return
  }
  const result = await usersService.resendVerifyEmail(user_id)
  res.json(result)
  return
}

export async function forgotPasswordController(
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) {
  const { _id, verify } = req.user as User
  const result = await usersService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify: verify })
  res.json(result)
  return
}

export async function verifyForgotPasswordController(req: Request, res: Response, next: NextFunction) {
  res.json({
    message: usersMessages.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export async function resetPasswordController(
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) {
  const { _id } = req.user as User
  const { password } = req.body
  const result = await usersService.resetPassword(_id!, password)
  res.json(result)
  return
}

export async function getMyProfileController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.getMyProfile(user_id)
  res.json(result)
  return
}

export async function updateMyProfileController(
  req: Request<ParamsDictionary, any, UpdateProfileReqBody>,
  res: Response,
  next: NextFunction
) {
  // const body = pick(req.body , ['name','date_of_birth','bio','location','website','username','avatar','cover_photo'])
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.updateMyProfile(user_id, req.body)
  res.json({
    message: usersMessages.UPDATE_ME_SUCCESS,
    result: user
  })
  return
}

export async function getMyUserInformationController(req: Request, res: Response, next: NextFunction) {
  const { username } = req.params
  const user = await usersService.getMyUserInformation(username)
  res.json(user)
  return
}

export async function followController(
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { follow_user_id } = req.body as FollowReqBody
  const result = await usersService.followUser(user_id, follow_user_id)
  res.json(result)
  return
}

export async function unFollowController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: follow_user_id } = req.params
  const result = await usersService.unFollowUser(user_id, follow_user_id)
  res.json(result)
  return
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  res.json(result)
  return
}

export async function refreshTokenController(req: Request, res: Response, next: NextFunction) {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp })
  res.json({success: true, message: usersMessages.REFRESH_TOKEN_SUCCESS, data: result })
  return
}
