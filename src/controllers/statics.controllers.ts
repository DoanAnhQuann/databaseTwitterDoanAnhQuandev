import { NextFunction, Request, Response } from "express";
import path from "path";
import { UPLOAD_IMAGE_DIR, UPLOAD_TEMP_VIDEO_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir";
import  fs  from "fs";
// import mime from "mime";
export async function staticSingleImage (req: Request, res: Response, next: NextFunction){
  const {name} = req.params;
  const filePath = path.resolve(UPLOAD_IMAGE_DIR, name)
  res.sendFile(filePath, (err)=> {
    if(err){
      res.status(404).json({message: 'Image not found'})
      return
    }
  })
  return
}

export async function staticSingleVideo(req: Request, res: Response, next: NextFunction) {
const range = req.headers.range
if(!range){
  res.status(400).json({message: 'Range header required'})
  return
}
const {name} = req.params
const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
//1mb = 10^6 bytes (tính theo hệ 10, đây là thứ mà chúng ta hya thấy trên UI)
// Còn nếu tính trên hệ nhị phân thì 1mb = 2^20bytes (1024* 1024)

//dung lượng video 
const videoSize = fs.statSync(videoPath).size;
//dung lượng video cho mỗi phân đoạn stream 
const chunkSize = 10**6 //1mb
//Lấy giá trị byte bắt đầu từ header Range (vd: bytes = 1048576-)
const start = Number(range.replace(/\D/g, ''))
//Lấy giá trị byte kết thúc, vượt quá dung lượng video thì lấy giá trị videoSize
const end = Math.min(start + chunkSize, videoSize - 1)

//Dung lương thực tế cho mỗi đoạn video stream
//Thường đây là chunkSize, ngoại trừ đoạn cuối cùng
const contentLength = end - start + 1
const contentType = 'video/mp4'
const headers = {
  'Content-Range': `bytes ${start}-${end}/${videoSize}`,
  'Accept-Ranges': 'bytes',
  'Content-Type': contentType,
  'Content-Length': contentLength
}

res.writeHead(206, headers)
const videoStreams = fs.createReadStream(videoPath, {start, end})
videoStreams.pipe(res)
}