/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // react-konva/konva requerem 'canvas' no Node — excluir no servidor
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'canvas']
    }
    return config
  },
}

export default nextConfig
