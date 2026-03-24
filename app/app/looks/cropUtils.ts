export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

export type CropResult = {
  dataUrl: string
  blob: Blob
  largura: number
  altura: number
  aspect_ratio: number
}

const MAX_PX = 1080
const QUALITY = 0.85

function createImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea
): Promise<CropResult> {
  const image = await createImageFromSrc(imageSrc)

  // Calcular dimensões finais (máx 1080px no lado maior)
  const scale = Math.min(1, MAX_PX / Math.max(pixelCrop.width, pixelCrop.height))
  const outW = Math.round(pixelCrop.width * scale)
  const outH = Math.round(pixelCrop.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outW, outH
  )

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas toBlob falhou'))),
      'image/jpeg',
      QUALITY
    )
  })

  return {
    dataUrl,
    blob,
    largura: outW,
    altura: outH,
    aspect_ratio: parseFloat((outW / outH).toFixed(4)),
  }
}
