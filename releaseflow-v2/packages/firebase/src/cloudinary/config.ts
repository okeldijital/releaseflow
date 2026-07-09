export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
  folders: {
    releases: 'releaseflow/releases',
    assets: 'releaseflow/assets',
    avatars: 'releaseflow/avatars',
  },
} as const;
