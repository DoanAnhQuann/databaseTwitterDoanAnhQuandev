import { Response, Request, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import User from '~/models/schemas/User.schema'
import { databaseService } from '~/services/database.services'
import { usersService } from '~/services/users.services'
import { validate } from '~/utils/validation'
// export function validate( req :Request, res: Response,next: NextFunction) {
//   const  body = req.body;
//   const {email, password} = body

//   if (!req.body) {
//     res.status(400).json({ success: false, message: "Body is missing" });
//     return;
//   }

//   if (email === "admin" && password === "123") {
//     res.status(200).json({
//       success: true,
//       message: "Login success",
//     });
//     return;
//   }
//   next()
// }

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 1, max: 100 }
      },
      trim: true,
      errorMessage: 'Name không dúng định dạng yêu cầu !'
    },
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom : {
        options: async (value, { req }) => {
        const isExistEmail =  await usersService.checkEmailExist(value)
        if(isExistEmail) {
          throw new Error('Email đã tồn tại!')
        }
        return true
        }
      },
      errorMessage: 'Email không dúng định dạng yêu cầu !'
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 50 }
      },
      trim: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      errorMessage: 'Password không dúng định dạng yêu cầu !'
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: { min: 6, max: 50 }
      },
      trim: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Confirm password phải giống password')
          }
          return true
        }
      },
      errorMessage: 'Confirm pasword không dúng định dạng yêu cầu !'
    },
    date_of_birth: {
      notEmpty: true,
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      },
      errorMessage: 'Ngày sinh không dúng định dạng yêu cầu !'
    }
  })
)
