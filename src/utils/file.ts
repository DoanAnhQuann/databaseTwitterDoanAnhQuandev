import { Request } from "express"
import { File } from "formidable"
import fs from "fs"
import path from "path"
import { UPLOAD_TEMP_IMAGE_DIR, UPLOAD_TEMP_VIDEO_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir"
export const initFolder = () => {
  [UPLOAD_TEMP_IMAGE_DIR, UPLOAD_TEMP_VIDEO_DIR].forEach((dir) => {
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true, //mục đích tạo folder nested
      })
    }
  })
}

export const handleUploadSingleImage = async (req: Request) => {
  //cách fix 1 esmodules dùng trong commonjs
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir:UPLOAD_TEMP_IMAGE_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, //300kb
    maxTotalFileSize: 300 * 1024 * 4 ,
    filter: function({name, originalFilename, mimetype}) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if(!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  //cách xử lí error khi error trong callback thì chỉ lỗi trong callback làm crash app tách ra làm promise cho rejected cả func 
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if(err){
        return reject(err)
      }
      //check case req send server null
      if(!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
    resolve(files.image as File[])
    })
  })
}

export const handleUploadSingleVideo = async (req: Request) => {
  //cách fix 1 esmodules dùng trong commonjs
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir:UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, //50mb
    filter: function({name, originalFilename, mimetype}) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4'))
      if(!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  //cách xử lí error khi error trong callback thì chỉ lỗi trong callback làm crash app tách ra làm promise cho rejected cả func 
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if(err){
        return reject(err)
      }
      //check case req send server null
      if(!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
    resolve(files.video as File[])
    })
  })
}

export const getNameFromFullName = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}