import mammoth from 'mammoth'

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function parseDocxFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return parseDocx(buffer)
}
