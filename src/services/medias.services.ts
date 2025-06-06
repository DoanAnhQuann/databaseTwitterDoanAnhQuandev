import { Request } from 'express'
import { getNameFromFullName, handleUploadSingleImage, handleUploadSingleVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import path from 'path'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { Media } from '~/models/Orther'
import { MediasType } from '~/constants/enum'
import { uploadFileTos3 } from '~/utils/s3'
import mime from 'mime'
config()
class MediasService {
  async handleUploadSingleImage(req: Request) {
    const files = await handleUploadSingleImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        //chấm filepath là trỏ tới folder uploads
        await sharp(file.filepath).jpeg().toFile(newPath)
        
        //upload lên s3 thêm chuỗi trc thì lên s3 tự động tạo folder
        const s3Result  = await uploadFileTos3({
          fileName: 'images/' + newFullFilename,
          filePath: newPath,
          ContentType: mime.getType(newPath) as string
        })

        //xóa ảnh trong thư mục temp khi ảnh đc xử lí và hoàn thiện
        await Promise.all([
          fsPromise.unlink(file.filepath),
          fsPromise.unlink(newPath)
        ])
      
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/image/${newName}.jpg`
        //     : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
        //   type: MediasType.Image
        // }
        return {
          url: s3Result.Location as string,
          type: MediasType.Image
        }
      })
    )
    return result
  }

  async handleUploadSingleVideo(req: Request) {
    const files = await handleUploadSingleVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const s3Result =  await uploadFileTos3({
          fileName: 'videos/' + file.newFilename,
          filePath: file.filepath,
          ContentType: mime.getType(file.filepath) as string
        })
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/video/${file.newFilename}`
        //     : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        //   type: MediasType.Video
        // }
        return {
          url: s3Result.Location as string,
          type: MediasType.Video
        }
      })
    )
    return result
  }
}

const mediasService = new MediasService()

export default mediasService
