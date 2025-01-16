import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import { databaseService } from './database.services'
import { RegisterRequestBody, UpdateProfileReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { usersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import httpStatus from '~/constants/httpStatus'
import { verify } from 'crypto'
import FollowUser from '~/models/schemas/FollowUsers.schema'
dotenv.config()
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify: verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN!,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify: verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN!,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify: verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify: verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN!,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_EXPIRES_IN
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    console.log(email_verify_token)
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    // const user_id = result.insertedId.toString()
    // const [access_token, refresh_token] = await Promise.all([
    //   this.signAccessToken(user_id),
    //   this.signRefreshToken(user_id)
    // ])
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    databaseService.refreshToken.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }))

    console.log(email_verify_token)
    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    await databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    const result = await databaseService.refreshToken.deleteOne({ token: refresh_token })
    return {
      message: usersMessages.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    //Tạo giá trị cập nhật new Date()
    //Mongodb cập nhật giá trị sử dụng $currentDate
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // Gửi email tại đây
    console.log('SEND EMAIL', email_verify_token)

    //cập nhật lại giá trị email_verify_token trong document user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token },
        $currentDate: { updated_at: true }
      }
    )
    return {
      message: usersMessages.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { forgot_password_token },
        $currentDate: { updated_at: true }
      }
    )

    //gửi email kèm đường link tới người dùng: https://twitter.com/forgot-password?token=token

    console.log('SEND EMAIL FORGOT PASSWORD', forgot_password_token)
    return {
      message: usersMessages.FORGOT_PASSWORD_SEND_EMAIL_SUCCESS
    }
  }

  async resetPassword(user_id: ObjectId, password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { password: hashPassword(password), forgot_password_token: '' },
        $currentDate: { updated_at: true }
      }
    )
    return {
      message: usersMessages.UPDATE_NEW_PASSWORD_SUCCESS,
      new_password: password
    }
  }

  async getMyProfile(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          _id: 0,
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({ message: usersMessages.USER_NOT_FOUND, status: httpStatus.NOT_FOUND })
    }
    return {
      message: usersMessages.GET_USER_PROFILE_SUCCESS,
      user
    }
  }

  async updateMyProfile(user_id: string, payload: UpdateProfileReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user =  await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateProfileReqBody & { date_of_birth: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          _id: 0,
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }
  
  async getMyUserInformation(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          _id: 0,
          password: 0,
          verify:0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({ message: usersMessages.USER_NOT_FOUND, status: httpStatus.NOT_FOUND })
    }
    return {
      message: usersMessages.GET_USER_INFORMATION_SUCCESS,
      user
    }
  }

  async followUser(user_id: string, followed_user_id: string){
    const followed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id : new ObjectId(followed_user_id),
    })
    if(followed === null) {
      await databaseService.followers.insertOne(new FollowUser({
        user_id: new ObjectId(user_id),
        followed_user_id : new ObjectId(followed_user_id),
      }))
      return {
        message: usersMessages.FOLLOW_USER_SUCCESS,
      }
    }
    return {
      message: usersMessages.FOLLOWED_USER,
    }
    
  }

  async unFollowUser(user_id: string, followed_user_id: string) {
    const followed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id : new ObjectId(followed_user_id),
    })
    if(followed){
      await databaseService.followers.deleteOne({
        user_id: new ObjectId(user_id),
        followed_user_id : new ObjectId(followed_user_id),
      })
      return {
        message: usersMessages.UNFOLLOW_USER_SUCCESS,
      }
    }
    return {
      message: usersMessages.UNFOLLOW_USER_FAILED,
    }
    
  }

  async changePassword(user_id: string, password: string) {
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: { password: hashPassword(password) },
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after'
      }
    )
    if (!user) {
      throw new ErrorWithStatus({ message: usersMessages.USER_NOT_FOUND, status: httpStatus.NOT_FOUND })
    }
    return {
      message: usersMessages.UPDATE_ME_SUCCESS,
      user
    }
  }
}

export const usersService = new UsersService()
