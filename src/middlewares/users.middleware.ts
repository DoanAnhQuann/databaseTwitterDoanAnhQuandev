import { verify } from 'crypto'
import { Response, Request, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import httpStatus from '~/constants/httpStatus'
import { usersMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'

import User from '~/models/schemas/User.schema'
import { databaseService } from '~/services/database.services'
import { usersService } from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: usersMessages.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: usersMessages.NAME_MUST_BE_A_STRING
      },
      isLength: {
        options: { min: 1, max: 100 },
        errorMessage: usersMessages.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      },
      trim: true,
     
    },
    email: {
      notEmpty: {
        errorMessage: usersMessages.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: usersMessages.EMAIL_IS_INVALID
      },
      trim: true,
      custom : {
        options: async (value, { req }) => {
        const isExistEmail =  await usersService.checkEmailExist(value)
        if(isExistEmail) {
          throw new Error( usersMessages.EMAIL_ALREADY_EXISTS)
        }
        return true
        }
      },
    },
    password: {
      notEmpty: {
        errorMessage: usersMessages.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: usersMessages.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: usersMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      trim: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: usersMessages.PASSWORD_MUST_BE_STRONG
      },
    
    },
    confirm_password: {
      notEmpty: {
        errorMessage: usersMessages.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: usersMessages.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: usersMessages.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      trim: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: usersMessages.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(usersMessages.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      },
    
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        },
        errorMessage: usersMessages.DATE_OF_BIRTH_MUST_BE_ISO8601
      },
    
    }
  },['body'])
)

export const loginValidator = validate(checkSchema({
  email: {
    notEmpty: {
      errorMessage: usersMessages.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: usersMessages.EMAIL_IS_INVALID
    },
    trim: true,
    custom : {
      options: async (value, { req }) => {
      const user =  await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password)})
      if(user === null) {
        throw new Error( usersMessages.EMAIL_OR_PASSWORD_IS_INCORRECT)
      }
      req.user = user
      return true
      }
    },
  },
  password: {
    notEmpty: {
      errorMessage: usersMessages.PASSWORD_IS_REQUIRED
    },
    isString: {
      errorMessage: usersMessages.PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: { min: 6, max: 50 },
      errorMessage: usersMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
    },
    trim: true,
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage: usersMessages.PASSWORD_MUST_BE_STRONG
    },
  
  },
}, ['body']))

export const accessTokenValidator = validate(checkSchema({
    Authorization : {
      notEmpty: {
        errorMessage: usersMessages.ACCESS_TOKEN_IS_REQUIRED
      },
      custom: {
        options: async (value: string , {req}) => {
          const access_token = value.split(' ')[1]
          if(!access_token) { 
            throw new ErrorWithStatus({
              message : usersMessages.ACCESS_TOKEN_IS_REQUIRED,
              status : httpStatus.UNAUTHORIZED
            })
          }
          try {
            const decoded_authorization  = await verifyToken( { token: access_token })
            ;(req as Request).decoded_authorization = decoded_authorization
          } catch (error) {
            throw new ErrorWithStatus ({
              message : usersMessages.VERIFY_TOKEN_ERROR,
              status : httpStatus.UNAUTHORIZED
            })
          }
          

          return true
        }
      }
    }
}, ['headers']))

export const refreshTokenValidator = validate(checkSchema({
  refresh_token: {
    notEmpty: {
      errorMessage: usersMessages.REFRESH_TOKEN_IS_REQUIRED
    },
    custom: {
      options: async (value: string, {req}) => {
        try {
         const [decoded_refresh_token, refresh_token] = await Promise.all([
          verifyToken({token: value}),
          databaseService.refreshToken.findOne({ token: value })
          ])
     
          if(refresh_token === null) {
            throw new ErrorWithStatus({
              message : usersMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
              status : httpStatus.UNAUTHORIZED
            })
          }
          ;(req as Request).decoded_refresh_token = decoded_refresh_token
        } catch (error) {
          if(error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus ({
              message : usersMessages.REFRESH_TOKEN_IS_INVALID,
              status : httpStatus.UNAUTHORIZED
            })
          }
          throw error
        }
        
        return true
      }
    }
  }
},['body']))
