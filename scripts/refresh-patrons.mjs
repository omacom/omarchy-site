#!/usr/bin/env node
import { readFile, rename, writeFile } from 'node:fs/promises'
import { summarizePatronage } from '../src/lib/patronage.ts'
import { fetchPatronage } from './lib/patronage.mjs'

export async function refreshPatrons() {
  const snapshot = summarizePatronage(await fetchPatronage())
  const target = new URL('../src/data/open-patrons.json', import.meta.url)
  const previous = JSON.parse(
    await readFile(target, 'utf8').catch((error) => {
      if (error.code !== 'ENOENT') throw error
      return 'null'
    }),
  )
  if (!snapshot.summary.donations && previous?.summary.donations) {
    throw new Error(
      'Zeffy returned an empty feed; keeping the previous patrons',
    )
  }
  if (previous?.summary.donations > snapshot.summary.donations) {
    console.warn(
      'Zeffy donation count decreased; check for removed or refunded gifts',
    )
  }
  const output =
    JSON.stringify(
      {
        checked: new Date().toISOString().slice(0, 10),
        ...snapshot,
      },
      null,
      2,
    ) + '\n'
  const temporary = new URL(`${target.href}.tmp`)
  await writeFile(temporary, output)
  await rename(temporary, target)
  console.log(
    `open-patrons.json: ${snapshot.summary.namedPatrons} named patrons, ${snapshot.summary.donations} donations`,
  )
}

if (import.meta.main) await refreshPatrons()
