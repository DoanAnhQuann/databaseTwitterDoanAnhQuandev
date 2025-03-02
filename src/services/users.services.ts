import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import { databaseService } from './database.services'
import { RegisterRequestBody, UpdateProfileReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { usersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import httpStatus from '~/constants/httpStatus'
import { verify } from 'crypto'
import FollowUser from '~/models/schemas/FollowUsers.schema'
import axios from 'axios'
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

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus , exp?: number}) {
    if(exp){
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify: verify,
          exp: exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN!,
      })
    }
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

  private decodeRefreshToken(refreshToken: string) {
    return verifyToken({
      token: refreshToken,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN!
    })
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
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    databaseService.refreshToken.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp }))

    console.log(email_verify_token)
    return {
      access_token,
      refresh_token
    }
  }

  async refreshToken({user_id, verify , refresh_token, exp}: {user_id: string, verify: UserVerifyStatus, refresh_token: string, exp?: number}) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp}),
      databaseService.refreshToken.deleteOne({token: refresh_token} )
    ])
    const decoded_refresh_token = await this.decodeRefreshToken( new_refresh_token)
    await databaseService.refreshToken.insertOne(new RefreshToken({user_id: new ObjectId(user_id), token: new_access_token, iat: decoded_refresh_token.iat , exp: decoded_refresh_token.exp}))
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const {data} = await axios.post("https://oauth2.googleapis.com/token", body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string,
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string){
    const {data} = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      params: {
        access_token: access_token,
        alt:'json'
      },
      
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      sub: string,
      email: string,
      email_verified: boolean,
      given_name: string,
      family_name: string,
      name: string,
      picture: string
    }
  }

  async oauth(code: string) {
    const {id_token , access_token} = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if(!userInfo.email_verified){
      throw new ErrorWithStatus({
        message: usersMessages.EMAIL_NOT_VERIFIED,
        status: httpStatus.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ email: userInfo.email})
    if(user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      const {iat, exp} = await this.decodeRefreshToken(refresh_token)
      await databaseService.refreshToken.insertOne(
        new RefreshToken({ user_id: user._id, token: refresh_token, iat,exp })
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    }else{
      //random string
      const password = Math.random().toString(36).substring(2,15)

      //không thì đăng ký
     const data = await this.register({
      email: userInfo.email,
      name: userInfo.name,
      date_of_birth: new Date().toString(),
      password,
      confirm_password: password
     })
     return {...data, newUser: 1, verify: UserVerifyStatus.Unverified}
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
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    databaseService.refreshToken.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token,iat, exp }))
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
