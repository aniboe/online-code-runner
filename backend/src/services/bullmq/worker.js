import { Worker } from 'bullmq'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import redis from '../redis/redis.js'
import { redisPub, redisSub } from '../redis/redisPubSub.js'

const serverProjectRootFolder = path.resolve('./PROJECT-SECSSIONS')

export const codeWorker = new Worker('code-execution-queue', async (job) => {
    const { userId, userFolderName, code } = job.data
    const userDir = path.join(serverProjectRootFolder, userFolderName)
    
    fs.writeFileSync(path.join(userDir, 'main.js'), code)

    const containerName = `sandbox-${userId}`

    // Force cleanup any leftover dead container from a previous run
    await new Promise((resolve) => {
        const killer = spawn('docker', ['rm', '-f', containerName])
        killer.on('close', resolve)
        killer.on('error', resolve)
    })

    const channels = {
        input: `sandbox:input:${userId}`,
        output: `sandbox:output:${userId}`
    }

    await redisSub.subscribe(channels.input)

    const dockerProcess = spawn(
        'docker',
        [
            'run', '--rm', '-i',
            '--name', containerName,
            '--memory', '128m',
            '--cpus', '0.5',
            '--pids-limit', '50',
            '--network', 'none',
            '-v', `${userDir}:/app`,
            'dir-exe',
            'node', '/app/main.js'
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] }
    )

    // Handle incoming stdin from the WebSocket server via Redis Pub/Sub
    const messageHandler = (channel, message) => {
        if (channel === channels.input && dockerProcess.stdin.writable) {
            dockerProcess.stdin.write(`${message}\n`)
        }
    }
    redisSub.on('message', messageHandler)

    // Stream container stdout back to WebSocket server via Redis Publish
    dockerProcess.stdout.on('data', (data) => {
        redisPub.publish(channels.output, JSON.stringify({ type: 'output', data: data.toString() }))
    })

    // Stream container stderr back
    dockerProcess.stderr.on('data', (data) => {
        redisPub.publish(channels.output, JSON.stringify({ type: 'error', data: data.toString() }))
    })

    return new Promise((resolve, reject) => {
        dockerProcess.on('error', (err) => {
            cleanup()
            reject(err)
        })

        dockerProcess.on('close', (exitCode) => {
            cleanup()
            resolve({ exitCode })
        })
    })

    async function cleanup() {
        redisSub.off('message', messageHandler)
        await redisSub.unsubscribe(channels.input).catch(() => {})
    }
}, { connection: redis })