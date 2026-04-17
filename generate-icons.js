const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, 'public/icons')
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

const src = path.join(__dirname, 'public/log.png')

async function run() {
  // Generate all standard sizes — white background
  for (const size of sizes) {
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
    console.log(`✓ icon-${size}x${size}.png`)
  }

  // apple-touch-icon 180x180 — white background
  await sharp(src)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, 'public/apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png (180x180)')

  // maskable 512x512 — dark navy background #0F172A, logo centered with padding
  const logoBuffer = await sharp(src)
    .resize(320, 320, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
  })
    .composite([{ input: logoBuffer, gravity: 'centre' }])
    .png()
    .toFile(path.join(__dirname, 'public/icon-maskable-512x512.png'))
  console.log('✓ icon-maskable-512x512.png')

  console.log('\n✅ Todos los íconos generados exitosamente')
}

run().catch(console.error)
