import express from 'express'
import { usersRouter, usersRouterOauth } from './routes/users.route'
import { databaseService } from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middleware'
import { mediasRoutes } from './routes/medias.routes'
import { initFolder } from './utils/file'
import { staticsRouter } from './routes/statics.routes'
import tweetsRouter from './routes/tweets.routes'
import { bookmarkRouter } from './routes/bookmarks.routes'
import { searchRouter } from './routes/searchs.routes'
import { createServer } from 'http'
import cors from 'cors'
import { conversationRoutes } from './routes/conversation.routes'
import initSocket from './utils/socket'
import helmet from 'helmet'
// import '~/utils/s3'
// import '~/utils/fake'
const app = express()
const httpServer = createServer(app);
const port = 4001
app.use(helmet())
app.use(cors({
  origin: '*', // allow only your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // allowed methods
  credentials: true // if you need to send cookies
}));
// Tạo folder upload nếu ko có
initFolder()
app.use(express.json())
app.use('/users', usersRouter)
app.use('/api', usersRouterOauth)
app.use('/medias', mediasRoutes)
//cách 1 để xem ảnh khi trả về url
app.use('/static', staticsRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmark', bookmarkRouter)
app.use('/search', searchRouter)
app.use('/conversation', conversationRoutes)
//cách 2 để xem ảnh khi trả về url
// app.use('/static/image',express.static(UPLOAD_IMAGE_DIR))
databaseService.connect().then(() => {
  databaseService.indexUser()
  databaseService.indexRefreshToken()
  databaseService.indexFollower()
  databaseService.indexTweets()
})
// errorHandler
app.use(defaultErrorHandler)
initSocket(httpServer)
httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


