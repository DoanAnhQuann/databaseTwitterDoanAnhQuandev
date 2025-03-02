import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { usersMessages } from '~/constants/messages'
import mediasService from '~/services/medias.services'
import { handleUploadSingleImage } from '~/utils/file'

export async function uploadSingleImageController(req: Request, res: Response, next: NextFunction) {
  const url = await mediasService.handleUploadSingleImage(req)
  res.json({
    message: usersMessages.UPLOAD_SUCCESS,
    result: url
  })
  return 
}


export async function uploadSingleVideoController(req: Request, res: Response, next: NextFunction) {
  const url = await mediasService.handleUploadSingleVideo(req)
  res.json({
    message: usersMessages.UPLOAD_SUCCESS,
    result: url
  })
  return
}