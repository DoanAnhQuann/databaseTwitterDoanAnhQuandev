export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned, // bị khóa
}
export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediasType {
  Image,
  Video
}

export enum MediaTypeQuery {
  Image = "image",
  Video = "video",
}

export enum PeopleFollow {
  Anyone = '0',
  Following = '1'
}