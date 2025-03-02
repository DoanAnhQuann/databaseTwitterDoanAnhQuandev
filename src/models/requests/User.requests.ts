import { JwtPayload } from "jsonwebtoken"
import { TokenType, UserVerifyStatus } from "~/constants/enum"

export interface RegisterRequestBody {
  name : string
  email: string 
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface LoginReqBody {

  email: string 
  password: string
 
}
export interface LogoutReqBody {
  refresh_token: string
}

export interface TokenPayload extends JwtPayload{
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  iat: number
  exp: number
}

export interface ForgotPasswordReqBody {
  email: string
}

export interface ChangePasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateProfileReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface FollowReqBody {
  follow_user_id: string
}