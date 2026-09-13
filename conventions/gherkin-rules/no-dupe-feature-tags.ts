const seen = new Map<string, string>()

export default {
  name: 'no-dupe-feature-tags',
  availableConfigs: { tags: [] },
  run(feature: any, file: any, config: any) {
    if (!feature) return []

    const patterns: string[] = config?.tags ?? []
    const errors: any[] = []

    for (const tag of feature.tags ?? []) {
      if (!patterns.some((pattern) => new RegExp(pattern).test(tag.name))) continue

      const first = seen.get(tag.name)
      if (first && first !== file.relativePath) {
        errors.push({
          message: `${tag.name} is already on ${first}`,
          rule: 'no-dupe-feature-tags',
          line: tag.location?.line ?? 1,
        })
      } else {
        seen.set(tag.name, file.relativePath)
      }
    }
    return errors
  },
}
