import jwt from 'jsonwebtoken';


export const signToken = ({payload, privateKey = process.env.JWT_SECRET as string, options = {
  algorithm: 'HS256'  // or 'HS384' or 'HS512'
}} : {
payload: string | Buffer |object,
privateKey?: string,
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