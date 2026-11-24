export function toSlug(str: string): string {
  return str
    .replace(/[\s&/]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .toLowerCase()
}

export function categoryAnchorId(name: string): string {
  return `cat-${toSlug(name)}`
}
