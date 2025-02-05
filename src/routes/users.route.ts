import express from 'express'
import { changePasswordController, emailVerifyController, followController, forgotPasswordController, getMyProfileController, getMyUserInformationController, loginController, logoutController, oauthController, registerController, resendVerifyEmailController, resetPasswordController, unFollowController, updateMyProfileController, verifyForgotPasswordController } from '~/controllers/users.controllers'
import { filterBodyRes } from '~/middlewares/common.middlewares'
import {  accessTokenValidator, changePasswordValidator, emailVerifyTokenValidator, followUserValidator, forgotPasswordValidator, getMyProfileValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, unFollowUserValidator, updateMyProfileValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
export const usersRouter = express.Router()
export const usersRouterOauth = express.Router()
// usersRouter.post('/login', validate, (req, res, next) => {
//   res.json({
//     message: 'Hello, ABP_EDU_FE!'
//   })
// })
/**
 *  Dang ki users moi
 *  path: /users/register
 *  method: POST
 *  request: body : {name:string ,email: string, password: string,confirm: password, date_of_birth: iso8601}
 *  Tạo ra 1 func trong util wrapAsync để xử lí lỗi khi controller gặp catch tránh phải try catch trong các controller
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 *  Dang nhap users 
 *  path: /users/login
 *  method: POST
 *  request: body : {email: string, password: string}
 */
usersRouter.post('/login',loginValidator,wrapRequestHandler(loginController))

/**
 *  Dang nhap users 
 *  path: /api/oauth/google
 *  method: GET
 
 */
usersRouterOauth.get('/oauth/google',wrapRequestHandler(oauthController))

/**
 *  Dang xuat users
 *  path: /users/logout
 *  method: POST
 * Headers: { Authorization: Bearer <access_token>}
 * Body: {refresh_token: string}
 * 
**/
usersRouter.post('/logout', accessTokenValidator,refreshTokenValidator,wrapRequestHandler(logoutController) )

/**
 *  Verify email when user client click on the link email
 *  path: /verify-email
 *  method: POST
 * Body: {email_verify_token: string}
 * 
**/
usersRouter.post('/verify-email', emailVerifyTokenValidator ,wrapRequestHandler(emailVerifyController) )

/**
 *  Gửi lại email
 *  path: /resend-verify-email
 *  method: POST
 *  Header:  {Authorization : Bearer <access_token>}
 *  body: {}
 * 
**/
usersRouter.post('/resend-verify-email', accessTokenValidator ,wrapRequestHandler(resendVerifyEmailController))


/**
 *  Quên mật khẩu submit email to reset password
 *  path: /forgot-password
 *  method: POST
 *  Body: {email: string}
 * 
**/
usersRouter.post('/forgot-password',forgotPasswordValidator,wrapRequestHandler(forgotPasswordController))


/**
 *  Verify link in in email to reset password
 *  path: /verify-forgot-password-token
 *  method: POST
 *  Body: {forgot_password_token: string}
 * 
**/
usersRouter.post('/verify-forgot-password-token',verifyForgotPasswordTokenValidator,wrapRequestHandler(verifyForgotPasswordController))

/**
 *  Reset password
 *  path: /reset-password
 *  method: POST
 *  Body: {forgot_password_token: string, password: string, confirm_password: string }
 * 
**/
usersRouter.post('/reset-password',resetPasswordValidator,wrapRequestHandler(resetPasswordController))

/**
 *  change password
 *  path: /change-password
 *  method: POST
 *  Body: {old password: string, password: string, confirm_password: string }
 * 
**/
usersRouter.post('/change-password',accessTokenValidator ,verifiedUserValidator, changePasswordValidator,wrapRequestHandler(changePasswordController))


/**
 *  Get me profile
 *  path: /my-profile
 *  method: get
 *   Header:  {Authorization : Bearer <access_token>}
 * 
**/
usersRouter.get('/get-my-profile',getMyProfileValidator,wrapRequestHandler(getMyProfileController))

/**
 *  Update my profile
 *  path: /reset-password
 *  method: patch
 *  Header:  {Authorization : Bearer <access_token>}
 *  Body: UserSchema
 * 
**/
usersRouter.patch('/update-my-profile',accessTokenValidator ,verifiedUserValidator, updateMyProfileValidator ,filterBodyRes(['name','date_of_birth','bio','location','website','username','avatar','cover_photo']), wrapRequestHandler(updateMyProfileController))

/**
 *  Get user info 
 *  path: /:username
 *  method: get
 *  
 * 
**/
usersRouter.get('/:username',wrapRequestHandler(getMyUserInformationController))

/**
 *  follow someone
 *  path: /follow
 *  method: POST
 *  Body: {follow_user_id: string }
 * Header:  {Authorization : Bearer <access_token>}
 * 
**/
usersRouter.post('/follow',accessTokenValidator ,verifiedUserValidator, followUserValidator ,wrapRequestHandler(followController))

/**
 *  unfollow someone
 *  path: /unfollow
 *  method: POST
 *  Header:  {Authorization : Bearer <access_token>}
 *  Body: {follow_user_id: string }
 * 
**/
usersRouter.delete('/follow/:user_id',accessTokenValidator ,verifiedUserValidator, unFollowUserValidator ,wrapRequestHandler(unFollowController))



