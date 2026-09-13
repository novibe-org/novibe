import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

/**
 * A specification is read out of a ref rather than the working tree. Planning against whatever
 * happens to be checked out means the backlog changes shape while somebody is prioritising it,
 * and a branch's experiment reads as the plan falling over.
 */
async function git(root, ...args) {
  const { stdout } = await run('git', ['-C', root, ...args], { maxBuffer: 32 * 1024 * 1024 })
  return stdout
}

export async function refsIn(root) {
  const local = await git(root, 'for-each-ref', '--sort=-committerdate',
    '--format=%(refname:short)', 'refs/heads')
  return local.split('\n').filter(Boolean)
}

export async function headOf(root) {
  try {
    return (await git(root, 'symbolic-ref', '--short', 'HEAD')).trim()
  } catch {
    return null
  }
}

/** Every .feature under one directory, as it stands in that ref. */
export async function featuresAt(root, ref, directory) {
  const listing = await git(root, 'ls-tree', '-r', '--name-only', ref, '--', directory)
  return listing.split('\n').filter((path) => path.endsWith('.feature'))
}

export const readAt = (root, ref, path) => git(root, 'show', `${ref}:${path}`)
