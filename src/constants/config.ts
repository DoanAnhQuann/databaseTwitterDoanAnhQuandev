import argv from 'minimist'
//sử dụng minimist để lấy ra tham số truyền từ command vào check xem mt production hay dev 
const options = argv(process.argv.slice(2))
export const isProduction = Boolean(options.production)