// 版本徽标：版本号由构建时从 package.json 注入（见 vite.config.ts 的 __APP_VERSION__）。
// 环境后缀口径：生产裸版本号、测试 _test、开发 _dev。
const env = (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'dev'

const suffix = env === 'prod' || env === 'production' ? '' : `_${env}`

export const APP_VERSION_LABEL = `v${__APP_VERSION__}${suffix}`
