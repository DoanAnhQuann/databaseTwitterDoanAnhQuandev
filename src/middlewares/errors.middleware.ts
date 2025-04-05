import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { omit } from 'lodash'
import httpStatus from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      res.status(err.status).json(omit(err, 'status'))
      return
    }
    const finalError: any = {}
    Object.getOwnPropertyNames(err).forEach((key) => {
      if (!Object.getOwnPropertyDescriptor(err, key)?.configurable || !Object.getOwnPropertyDescriptor(err, key)?.writable) {
      return
      }
  
      finalError[key] = err[key]
    })
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: finalError.message,
      errorInfo: omit(finalError, 'stack')
    })
  
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      errorInfo: omit(error as any, 'stack')
    })
  }

}