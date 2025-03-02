import express , {Request , Response, NextFunction} from 'express'
import { usersRouter, usersRouterOauth } from './routes/users.route'
import { databaseService } from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middleware'
import { mediasRoutes } from './routes/medias.routes'
import { initFolder } from './utils/file'
import { UPLOAD_IMAGE_DIR } from './constants/dir'
import { staticsRouter } from './routes/statics.routes'
import tweetsRouter from './routes/tweets.routes'
const app = express()
const port = 4000
// Tạo folder upload nếu ko có
initFolder()
app.use(express.json())
app.use('/users', usersRouter)
app.use('/api', usersRouterOauth)
app.use('/medias', mediasRoutes)
//cách 1 để xem ảnh khi trả về url 
app.use('/static', staticsRouter)
app.use('/tweets', tweetsRouter)
//cách 2 để xem ảnh khi trả về url 
// app.use('/static/image',express.static(UPLOAD_IMAGE_DIR))
databaseService.connect().then(() =>{
  databaseService.indexUser()
  databaseService.indexRefreshToken()
  databaseService.indexFollower()
})
// errorHandler
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})