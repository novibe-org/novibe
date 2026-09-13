export default {
  name: 'required-feature-tags',
  availableConfigs: { tags: [] },
  run(feature: any, _file: any, config: any) {
    if (!feature) return []

    const wanted: string[] = config?.tags ?? []
    const has: string[] = (feature.tags ?? []).map((t: any) => t.name)
    const line = feature.location?.line ?? 1

    return wanted
      .filter((pattern) => !has.some((tag) => new RegExp(pattern).test(tag)))
      .map((pattern) => ({
        message: `No tag matching ${pattern} on Feature`,
        rule: 'required-feature-tags',
        line,
      }))
  },
}
