export class EnhanceApp {
  private _files: Set<string>

  constructor() {
    this._files = new Set()
  }

  addFile(file: string) {
    this._files.add(file)
    return this
  }

  removeFile(file: string) {
    this._files.delete(file)
    return this
  }

  get files() {
    return [...this._files]
  }
}