import express from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {  accessTokenValidator, loginValidator, refreshTokenValidator, registerValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'
export const usersRouter = express.Router()
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
 *  Dang xuat users
 *  path: /users/logout
 *  method: POST
 * Headers: { Authorization: Bearer <access_token>}
 * Body: {refresh_token: string}
 * 
**/
usersRouter.post('/logout', accessTokenValidator,refreshTokenValidator,wrapRequestHandler(logoutController) )