 import express , {Request , Response, NextFunction, ErrorRequestHandler} from 'express'
import { omit } from 'lodash'
import httpStatus from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler:  ErrorRequestHandler  = (err:any, req: Request, res: Response, next: NextFunction) => {
  if(err instanceof ErrorWithStatus) {
     res.status(err.status).json(omit(err, 'status'))
     return
  }
   Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true} )
   })
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, 'stack'),
  })
}

