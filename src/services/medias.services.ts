import { Request } from 'express'
import { getNameFromFullName, handleUploadSingleImage, handleUploadSingleVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import path from 'path'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { Media } from '~/models/Orther'
import { MediasType } from '~/constants/enum'
config()
class MediasService {
  async handleUploadSingleImage(req: Request) {
    const files = await handleUploadSingleImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        //chấm filepath là trỏ tới folder uploads
        await sharp(file.filepath).jpeg().toFile(newPath)
        //xóa ảnh trong thư mục temp khi ảnh đc xử lí và hoàn thiện
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediasType.Image
        }
      })
    )
    return result
  }

  async handleUploadSingleVideo(req: Request) {
    const files = await handleUploadSingleVideo(req)
    const result = await Promise.all(files.map(file =>{
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        type: MediasType.Video
      }

    }))
return result
  }
}

const mediasService = new MediasService()

export default mediasService
