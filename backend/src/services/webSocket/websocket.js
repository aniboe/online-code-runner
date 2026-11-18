import { WebSocketServer } from 'ws'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import Redis from 'ioredis'
import { spawn } from 'child_process'
import { verifyToken } from '../../utils/Auth-JWT.js'
import redis from '../redis/redis.js'
import { codeQueue } from '../bullmq/queue.js'

const refMap = new Map()

export function initWS(server) {
    const webSocketInstance = new WebSocketServer({ server })

    webSocketInstance.on('connection', async (websocket, req) => {
        const cookies = req.headers.cookie
        const token = cookies?.split('=').slice(1).join("=")
        
        if (!token) {
            websocket.send(JSON.stringify({ error: 'Unauthorized: Missing token' }))
            return websocket.close()
        }

        let userData = null
        try {
            userData = await verifyToken(token)
        } catch (err) {
            websocket.send(JSON.stringify({ error: 'Unauthorized: Invalid token' }))
            return websocket.close()
        }

        if (!userData || !userData._id) {
            websocket.send(JSON.stringify({ error: 'Unauthorized: Invalid user session' }))
            return websocket.close()
        }

        const userId = userData._id
        const serverProjectRootFolder = path.resolve('./PROJECT-SECSSIONS')
        let userFolderName = ''

        // Session & Directory Management
        try {
            const existingFold = await redis.hget(userId, 'foldername')

            if (existingFold && fs.existsSync(path.join(serverProjectRootFolder, existingFold))) {
                userFolderName = existingFold

                const getExistingTimeout = refMap.get(userId)
                if (getExistingTimeout) {
                    clearTimeout(getExistingTimeout)
                    refMap.delete(userId)
                }
            } else {
                userFolderName = crypto.randomUUID()
                const newUserProjectPath = path.join(serverProjectRootFolder, userFolderName)
                fs.mkdirSync(newUserProjectPath, { recursive: true })
                fs.writeFileSync(path.join(newUserProjectPath, 'main.js'), "console.log('Hello World '); // replace this and write ur code here")

                await redis.hset(userId, 'foldername', userFolderName)
            }
        } catch (error) {
            console.error('Session initialization error:', error)
            websocket.send(JSON.stringify({ error: 'Internal server error during session setup' }))
            return websocket.close()
        }

        const userDir = path.join(serverProjectRootFolder, userFolderName)
        const outputChannel = `sandbox:output:${userId}`
        const inputChannel = `sandbox:input:${userId}`

        // Dedicated subscriber for streaming output back down to this client socket
        const wsRedisSubscriber = new Redis({ host: 'localhost', port: 6379 })
        await wsRedisSubscriber.subscribe(outputChannel)

        wsRedisSubscriber.on('message', (channel, message) => {
            if (channel === outputChannel) {
                websocket.send(message)
            }
        })

        websocket.send(JSON.stringify({ type: 'session', folderName: userFolderName, isRegistered: true }))

        // Message Handling
        websocket.on('message', async (message) => {
            let receivedMessage
            try {
                receivedMessage = JSON.parse(message.toString())
            } catch {
                websocket.send(JSON.stringify({ error: 'Invalid input payload' }))
                return
            }

            if (!receivedMessage || typeof receivedMessage !== 'object') {
                websocket.send(JSON.stringify({ error: 'Invalid input payload' }))
                return
            }

            // 1. Stop Action
            if (receivedMessage.action === 'stop') {
                const containerName = `sandbox-${userId}`
                const dockerProcess = spawn('docker', ['kill', containerName])
                dockerProcess.once('error', (error) => {
                    console.error('Failed to stop execution:', error)
                    if (websocket.readyState === 1) {
                        websocket.send(JSON.stringify({ error: 'Failed to stop execution' }))
                    }
                })
                dockerProcess.once('close', (exitCode) => {
                    if (websocket.readyState !== 1) return

                    websocket.send(JSON.stringify(
                        exitCode === 0
                            ? { type: 'stopped' }
                            : { error: 'No running execution could be stopped' }
                    ))
                })
                return
            }

            // 2. Input (Stdin) Action
            if (receivedMessage.action === 'input') {
                if (typeof receivedMessage.input !== 'string') {
                    websocket.send(JSON.stringify({ error: 'Input must be a string' }))
                    return
                }
                await redis.publish(inputChannel, receivedMessage.input)
                return
            }

            // 3. Run Action
            if (receivedMessage.action !== 'run') return
            if (typeof receivedMessage.code !== 'string') {
                websocket.send(JSON.stringify({ error: 'Run action requires code as a string' }))
                return
            }

            try {
                fs.writeFileSync(path.join(userDir, 'main.js'), receivedMessage.code)

                const containerName = `sandbox-${userId}`
                spawn('docker', ['stop', containerName])

                await codeQueue.add('execute-code', {
                    userId,
                    userFolderName,
                    code: receivedMessage.code
                }, { removeOnComplete: true, removeOnFail: true })

            } catch (error) {
                console.error('Failed to enqueue code run:', error)
                websocket.send(JSON.stringify({ error: 'Failed to save code or start execution queue' }))
            }
        })

        // Connection Close & Delayed Cleanup
        websocket.on('close', () => {
            wsRedisSubscriber.quit()

            const containerName = `sandbox-${userId}`
            spawn('docker', ['stop', containerName])

            const timeoutRef = setTimeout(async () => {
                try {
                    fs.rmSync(userDir, { recursive: true, force: true })
                    await redis.hdel(userId, 'foldername')
                    refMap.delete(userId)
                } catch (error) {
                    console.error('Error during delayed cleanup:', error)
                }
            }, 1000 * 60 * 5) // 5 minutes grace period

            refMap.set(userId, timeoutRef)
        })
    })
}