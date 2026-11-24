import type { NavCategory } from '../types'

/**
 * 个人站点清单（示例）——放你自己的站点，不进仓库默认数据。
 *
 * 用法：
 * 1. 把本文件复制为同目录下的 `navigation.local.ts`（该文件已在 .gitignore 中，不会被提交）。
 * 2. 把下面的示例分类换成你自己的站点清单。
 * 3. 重新构建即可：存在 navigation.local.ts 时，其分类会合并并置顶展示；
 *    不存在时只展示 navigation.ts 里的通用默认数据，他人 fork 不受影响。
 */
export const localNavigation: NavCategory[] = [
  {
    name: '我的站点',
    icon: 'mdi:apps',
    items: [
      {
        title: '我的博客',
        description: '换成你的博客地址与介绍',
        url: 'https://example.com/blog',
        icon: 'mdi:newspaper',
        aliases: ['blog', '博客'],
      },
      {
        title: '我的主页',
        description: '换成你的个人主页',
        url: 'https://example.com',
        icon: 'mdi:home',
        aliases: ['home', '主页'],
      },
    ],
  },
]
