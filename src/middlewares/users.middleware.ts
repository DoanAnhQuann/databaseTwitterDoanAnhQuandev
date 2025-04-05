import { verify } from 'crypto'
import { Response, Request, NextFunction } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'
import httpStatus from '~/constants/httpStatus'
import { usersMessages } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'

import User from '~/models/schemas/User.schema'
import { databaseService } from '~/services/database.services'
import { usersService } from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
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
  }
}

const confirmPasswordSchema: ParamSchema = {
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
  }
}

const forgotPasswordTokenSchema:ParamSchema  =  {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: usersMessages.FORGOT_PASSWORD_IS_REQUIRED,
          status: httpStatus.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN!
        })
        const {user_id} = decoded_forgot_password_token
        const user = await 
          databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: usersMessages.USER_NOT_FOUND,
            status: httpStatus.UNAUTHORIZED
          })
        }
        if(user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: usersMessages.INVALID_FORGOT_PASSWORD_TOKEN,
            status: httpStatus.UNAUTHORIZED
          })
        }
        req.user = user
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: usersMessages.FORGOT_PASSWORD_IS_INVALID,
            status: httpStatus.UNAUTHORIZED
          })
        }
        throw error
      }

      return true
    }
  }
}

const accessTokenSchema:ParamSchema = {
  // notEmpty: {
  //   errorMessage: usersMessages.ACCESS_TOKEN_IS_REQUIRED
  // },
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      const access_token = (value || '').split(' ')[1]
      if (!access_token) {
        throw new ErrorWithStatus({
          message: usersMessages.ACCESS_TOKEN_IS_REQUIRED,
          status: httpStatus.UNAUTHORIZED
        })
      }
      try {
        const decoded_authorization = await verifyToken({
          token: access_token,
          secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN!
        })
        ;(req as Request).decoded_authorization = decoded_authorization
      } catch (error) {
        throw new ErrorWithStatus({
          message: usersMessages.VERIFY_TOKEN_ERROR,
          status: httpStatus.UNAUTHORIZED
        })
      }

      return true
    }
  }
}

const nameSchema: ParamSchema ={
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
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: usersMessages.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}

export const followUserIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, {req}) => {
      if(!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: usersMessages.INVALID_FOLLOWED_USER_ID,
          status: httpStatus.NOT_FOUND
        })
      }

      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      
      if(followed_user === null) {
        throw new ErrorWithStatus({
          message: usersMessages.USER_NOT_FOUND,
          status: httpStatus.NOT_FOUND
        })
      }
    }
  }
} 
export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: usersMessages.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: usersMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const isExistEmail = await usersService.checkEmailExist(value)
            if (isExistEmail) {
              throw new Error(usersMessages.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema ,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: usersMessages.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: usersMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(usersMessages.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            req.user = user
            return true
          }
        }
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
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: accessTokenSchema
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        // notEmpty: {
        //   errorMessage: usersMessages.REFRESH_TOKEN_IS_REQUIRED
        // },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: usersMessages.REFRESH_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN! }),
                databaseService.refreshToken.findOne({ token: value })
              ])

              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: usersMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: usersMessages.REFRESH_TOKEN_IS_INVALID,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              throw error
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        // notEmpty: {
        //   errorMessage: usersMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,

        // },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: usersMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: usersMessages.EMAIL_VERIFY_TOKEN_IS_ERROR,
                status: httpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: usersMessages.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: usersMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value
            })
            if (user === null) {
              throw new Error(usersMessages.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema({
  password: passwordSchema,
  confirm_password: confirmPasswordSchema ,
  forgot_password_token: forgotPasswordTokenSchema
},['body'])
)

export const getMyProfileValidator = validate(
  checkSchema({
    Authorization: accessTokenSchema
  }, ['headers'])
) 

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) =>{
  const {verify} = req.decoded_authorization as TokenPayload
  
  next()
}

export const updateMyProfileValidator = validate(
  checkSchema({
    name: {
      ...nameSchema,
      optional: true,
      notEmpty: undefined,
    },
    date_of_birth: {
      ...dateOfBirthSchema,
      optional:true,
    },
    bio: {
      optional: true,
      isLength: {
        options: { min: 6, max: 200 },
        errorMessage: usersMessages.BIO_LENGTH_MUST_BE_FROM_6_TO_200
      },
      isString: {
        errorMessage: usersMessages.BIO_MUST_BE_A_STRING
      },
      trim: true
    },
    location: {
      optional: true,
      isLength: {
        options: { min: 6, max: 200 },
        errorMessage: usersMessages.LOCATION_LENGTH_MUST_BE_FROM_6_TO_200
      },
      isString: {
        errorMessage: usersMessages.LOCATION_MUST_BE_A_STRING
      },
      trim: true
    },
    website: {
      optional: true,
      isLength: {
        options: { min: 6, max: 200 },
        errorMessage: usersMessages.WEBSITE_LENGTH_MUST_BE_FROM_6_TO_200
      },
      isString: {
        errorMessage: usersMessages.WEBSITE_MUST_BE_A_STRING
      },
      trim: true
    },
    username: {
      optional: true,
      isString: {
        errorMessage: usersMessages.USERNAME_MUST_BE_A_STRING
      },
      custom : {
        options: async (value, { req }) => {
          if(!REGEX_USERNAME.test(value)){
            throw new Error(usersMessages.USERNAME_INVALID)
          }
          const user = await databaseService.users.findOne({
            username: value
          })
         if(user) {
           throw new Error(usersMessages.USERNAME_ALREADY_EXISTS)
         }
        }
      },
      trim: true
    },
    avatar: {
      optional: true,
      isLength: {
        options: { min: 6, max: 400 },
        errorMessage: usersMessages.AVATAR_LENGTH_MUST_BE_FROM_6_TO_400
      },
      isString: {
        errorMessage: usersMessages.AVATAR_MUST_BE_A_STRING
      },
      trim: true
    },
    cover_photo: {
      optional: true,
      isLength: {
        options: { min: 6, max: 400 },
        errorMessage: usersMessages.COVER_PHOTO_LENGTH_MUST_BE_FROM_6_TO_400
      },
      isString: {
        errorMessage: usersMessages.COVER_PHOTO_MUST_BE_A_STRING
      },
      trim: true
    },
  }, ['body'])
)

export const followUserValidator = validate(
  checkSchema({
    follow_user_id: followUserIdSchema
},['body']))


export const unFollowUserValidator = validate(
  checkSchema({
    user_id: followUserIdSchema
},['params']))

export const changePasswordValidator = validate(checkSchema({
  old_password: {
    ...passwordSchema,
    custom: {
      options: async (value, {req}) => {
        const {user_id} = req.decoded_authorization as TokenPayload
        const user = await databaseService.users.findOne({
          _id: new ObjectId(user_id)
        })
        const {password} = user as User
        const isMatch = hashPassword(value) === password
        if (!isMatch) {
          throw new ErrorWithStatus({
            message: usersMessages.OLD_PASSWORD_IS_INCORRECT,
            status: httpStatus.UNAUTHORIZED
          })
        }
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema
}, ['body']))


export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    //req.header ở server không phân biệt chữ hoa chữ thường
    //req.headers map từ chữ hoa sang chữ thường
    if(req.headers.authorization) {
      return middleware(req, res, next)
    }
    next()
  }
}