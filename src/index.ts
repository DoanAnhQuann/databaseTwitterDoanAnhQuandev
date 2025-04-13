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
import rateLimit from 'express-rate-limit'
import { config } from 'dotenv'
// import '~/utils/s3'
// import '~/utils/fake'
config()
const app = express()

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})
app.use(limiter)
const httpServer = createServer(app);
const port = process.env.PORT
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


