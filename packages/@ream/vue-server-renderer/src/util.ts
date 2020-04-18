export const isPlainObject = (obj: any) =>
  Object.prototype.toString.call(obj) === '[object Object]'
