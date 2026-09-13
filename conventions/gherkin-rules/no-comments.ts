export default {
  name: 'no-comments',
  availableConfigs: {},
  run(_feature: any, file: any) {
    return (file?.lines ?? [])
      .map((line: string, at: number) => ({ text: line.trim(), line: at + 1 }))
      .filter(({ text }: any) => text.startsWith('#'))
      .map(({ line }: any) => ({
        message: 'no comments: the narrative explains, a @cites: tag says where it came from',
        rule: 'no-comments',
        line,
      }))
  },
}
