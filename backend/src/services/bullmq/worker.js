import { Worker } from 'bullmq'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import redis from '../redis/redis.js'
import { redisPub, redisSub } from '../redis/pubsub.js'

const serverProjectRootFolder = path.resolve('./PROJECT-SECSSIONS')

export const codeWorker = new Worker('code-execution-queue', async (job) => {

    console.log("worker initiated successfully ");
    
    const { userId, userFolderName, code } = job.data
    const userDir = path.join(serverProjectRootFolder, userFolderName)
    
    fs.writeFileSync(path.join(userDir, 'main.js'), code)

    const containerName = `sandbox-${userId}`

    const channels = {
        input: `sandbox:input:${userId}`,
        output: `sandbox:output:${userId}`
    }

    // 1. Notify frontend that execution is preparing
    redisPub.publish(channels.output, JSON.stringify({ type: 'status', data: 'preparing' }))

    // Force cleanup any leftover dead container from a previous run
    await new Promise((resolve) => {
        const killer = spawn('docker', ['rm', '-f', containerName])
        killer.on('close', resolve)
        killer.on('error', resolve)
    })

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

    // 2. Notify frontend that container has started running
    redisPub.publish(channels.output, JSON.stringify({ type: 'status', data: 'running' }))

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
            redisPub.publish(channels.output, JSON.stringify({ type: 'status', data: 'error', message: err.message }))
            cleanup()
            reject(err)
        })

        dockerProcess.on('close', (exitCode) => {
            // 3. Send the exit code and closed status to the frontend
            const finalCode = exitCode ?? 0
            redisPub.publish(channels.output, JSON.stringify({ type: 'exit', exitCode: finalCode }))
            cleanup()
            resolve({ exitCode: finalCode })
        })
    })

    async function cleanup() {
        redisSub.off('message', messageHandler)
        await redisSub.unsubscribe(channels.input).catch(() => {})
    }
}, { connection: redis })