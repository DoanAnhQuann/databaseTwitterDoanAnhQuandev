import { Server } from "socket.io";
import { verifyAccessToken } from "./common";
import { TokenPayload } from "~/models/requests/User.requests";
import { ErrorWithStatus } from "~/models/Errors";
import { UserVerifyStatus } from "~/constants/enum";
import { usersMessages } from "~/constants/messages";
import httpStatus from "~/constants/httpStatus";
import { databaseService } from "~/services/database.services";
import Conversations from "~/models/schemas/Conversation.schema";
import { ObjectId } from "mongodb";

const initSocket = (httpServer: any) => {
  const io = new Server(httpServer, { 
    cors: {
      origin: '*'
    }
   });
  const users: {
    [key: string]: {
      socket_id: string
    }} = {}
    //socket middlaware
    io.use(async (socket, next) => {
      console.log(socket.id, socket.handshake.auth)
      const  Authorization  = socket.handshake.auth.Authorization
      const access_token = Authorization?.split(' ')[1]
      // console.log( access_token)
    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      const {verify} = decoded_authorization as TokenPayload
      if(verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: usersMessages.USER_NOT_VERIFIED,
          status: httpStatus.FORBIDDEN
        })
      }
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'Unauthorized Error',
        data: error
      })
    }
    })
  io.on("connection",  (socket) => {
    console.log(`user id ${socket.id} đã connected`);
    const user_id = socket.handshake.auth._id
    users[user_id] = {
      socket_id: socket.id
    }
    socket.on("private message",async(data) => {
      const receiver_socket_id = users[data.to]?.socket_id
    socket.use(async(packet, next) => {
      const {access_token} = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })
  
    socket.on('error', (error) => {
      if(error.message === 'Unauthorized'){
        socket.disconnect()
      }
    })
  
     await databaseService.conversations.insertOne(new Conversations({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.content
      }))
      if(receiver_socket_id) {
        socket.to(receiver_socket_id).emit('receiver private message', {
          content : data.content,
          from: user_id
        })
      }
    })
    socket.on("disconnect", () => {
      delete users[user_id]
      console.log(`user id ${socket.id} đã disconnect`);
    });
  });
}

export default initSocket