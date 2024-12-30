import express , {Request , Response, NextFunction} from 'express'
import { usersRouter } from './routes/users.route'
import { databaseService } from './services/database.services'

const app = express()
const port = 3000


app.use(express.json())
app.use('/users', usersRouter)
databaseService.connect()
// errorHandler
app.use((err: any, req:Request , res:Response, next:NextFunction) => {
  console.error(err.message)
  res.status(400).json({error : err.message})
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})