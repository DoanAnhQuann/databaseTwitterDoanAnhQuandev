import httpStatus from "~/constants/httpStatus";
import { usersMessages } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/Errors";
import { verifyToken } from "./jwt";
import { Request } from "express";

export const numberEnumToArray = (numberEnum: {[key: string]: string | number}) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[];
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: usersMessages.ACCESS_TOKEN_IS_REQUIRED,
      status: httpStatus.UNAUTHORIZED
    })
  }
  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN!
    })
    if(req){
      ;(req as Request).decoded_authorization = decoded_authorization
      return true
    }
    return decoded_authorization
  } catch (error) {
    throw new ErrorWithStatus({
      message: usersMessages.VERIFY_TOKEN_ERROR,
      status: httpStatus.UNAUTHORIZED
    })
  }
}