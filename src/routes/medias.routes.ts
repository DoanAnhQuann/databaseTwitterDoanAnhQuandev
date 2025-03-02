import { Router } from 'express'
import { uploadSingleImageController, uploadSingleVideoController } from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'
export const mediasRoutes = Router()

mediasRoutes.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadSingleImageController)
)

mediasRoutes.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadSingleVideoController)
)
