import express , {Request , Response, NextFunction} from 'express'
import { usersRouter, usersRouterOauth } from './routes/users.route'
import { databaseService } from './services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middleware'

const app = express()
const port = 4000


app.use(express.json())
app.use('/users', usersRouter)
app.use('/api', usersRouterOauth)
databaseService.connect()
// errorHandler
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})