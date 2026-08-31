import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'

type SeedTarget = 'all' | 'bc' | 'mip'

const WORKSPACES: Record<Exclude<SeedTarget, 'all'>, string> = {
    bc: 'bilan-carbone',
    mip: 'mip',
}

const runWorkspaceSeed = (workspace: string) => {
    console.log(`\n> yarn workspace ${workspace} tsx prisma/seed/index.ts`)

    const result = spawnSync('yarn', ['workspace', workspace, 'tsx', 'prisma/seed/index.ts'], {
        stdio: 'inherit',
    })

    return result.status === 0
}

const main = async () => {
    const { values } = parseArgs({
        options: {
            target: { type: 'string' },
            continueOnError: { type: 'boolean' },
        },
        allowPositionals: false,
    })

    const target = (values.target ?? 'all') as SeedTarget
    const continueOnError = values.continueOnError ?? target === 'all'

    if (!['all', 'bc', 'mip'].includes(target)) {
        throw new Error(`Invalid --target value: ${target}. Expected one of: all, bc, mip`)
    }

    const targets: Exclude<SeedTarget, 'all'>[] = target === 'all' ? ['bc', 'mip'] : [target]
    const failed: Exclude<SeedTarget, 'all'>[] = []

    for (const currentTarget of targets) {
        const succeeded = runWorkspaceSeed(WORKSPACES[currentTarget])

        if (!succeeded) {
            failed.push(currentTarget)

            if (!continueOnError) {
                break
            }
        }
    }

    if (failed.length > 0) {
        throw new Error(`Seed failed for target(s): ${failed.join(', ')}`)
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
