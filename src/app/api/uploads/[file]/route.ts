import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request, { params }: { params: { file: string } }) {
  const uploadsPath = path.join(process.cwd(), 'uploads')
  const filePath = path.join(uploadsPath, params.file)

  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 })
  }

  const file = fs.readFileSync(filePath)
  return new NextResponse(file, {
    headers: {
      'Content-Type': 'image/jpeg' // Adjust based on file type
    }
  })
}