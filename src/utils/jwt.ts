import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { error } from 'console';
import { TokenPayload } from '~/models/requests/User.requests';
dotenv.config()
export const signToken = ({payload, privateKey, options = {
  algorithm: 'HS256'  // or 'HS384' or 'HS512'
}} : {
payload: string | Buffer |object,
privateKey: string,
options?: jwt.SignOptions
} ) => {
  return new Promise<string>((resolve, rejects) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        throw rejects(error);
      }
      return resolve(token as string);
    })
  })
}

export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
 return new Promise<TokenPayload>((resolve, reject) => {
  jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if(error) { 
        throw reject(error);
      }
      resolve(decoded as TokenPayload)
  })
 })
}