import { WebSocketServer } from 'ws'
import crypto from 'crypto'
import fs from 'fs'
import { verifyToken } from '../../utils/Auth-JWT.js'
import path from 'path'
import redis from '../redis/redis.js'
import { spawn } from 'child_process'

const refMap = new Map()

export function initWS(server) {
    const webSocketInstance = new WebSocketServer({ server })

    webSocketInstance.on('connection', async (websocket, req) => {

        // Authentication Check (Strictly Auth Only)
        const cookies = req.headers.cookie
        // const token = cookies?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] // Safer token extraction placeholder
        const token = cookies?.split('=').slice(1).join("=") // Safer token extraction placeholder
        
        
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
        let activeDockerProcess = null

        // Session & Directory Management
        try {
            const existingFold = await redis.hget(userId, 'foldername')

            if (existingFold && fs.existsSync(path.join(serverProjectRootFolder, existingFold))) {
                userFolderName = existingFold

                // Clear any pending cleanup timeout since user reconnected
                const getExistingTimeout = refMap.get(userId)
                if (getExistingTimeout) {
                    clearTimeout(getExistingTimeout)
                    refMap.delete(userId)
                }
            } else {
                userFolderName = crypto.randomUUID()
                const newUserProjectPath = path.join(serverProjectRootFolder, userFolderName)
                fs.mkdirSync(newUserProjectPath, { recursive: true })

                // NOTE :writing in file shoud be done done using front end on  create file
                // Create default main.js for first-time session
                fs.writeFileSync(path.join(newUserProjectPath, 'main.js'), "console.log('Hello World '); // replace this and write ur code here")

                await redis.hset(userId, 'foldername', userFolderName)
            }
        } catch (error) {
            console.error('Session initialization error:', error)
            websocket.send(JSON.stringify({ error: 'Internal server error during session setup' }))
            return websocket.close()
        }

        const userDir = path.join(serverProjectRootFolder, userFolderName)

        // Notify frontend of successful session initialization
        websocket.send(JSON.stringify({ type: 'session', folderName: userFolderName, isRegistered: true }))

        // Message Handling (Docker Execution)
        websocket.on('message', (message) => {
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

            if (receivedMessage.action === 'stop') {
                activeDockerProcess?.kill()
                activeDockerProcess = null
                return
            }

            if (receivedMessage.action === 'input') {
                if (typeof receivedMessage.input !== 'string') {
                    websocket.send(JSON.stringify({ error: 'Input must be a string' }))
                    return
                }

                if (!activeDockerProcess || !activeDockerProcess.stdin.writable) {
                    websocket.send(JSON.stringify({ error: 'No running process to receive input' }))
                    return
                }

                activeDockerProcess.stdin.write(receivedMessage.input)
                return
            }


            
            if (receivedMessage.action !== 'run') return

            if (typeof receivedMessage.code !== 'string') {
                websocket.send(JSON.stringify({ error: 'Run action requires code as a string' }))
                return
            }






            try {
                fs.writeFileSync(path.join(userDir, 'main.js'), receivedMessage.code)

                if (activeDockerProcess) {
                    activeDockerProcess.kill()
                }

                const dockerProcess = spawn( // goes into bullmq worker
                    'docker',
                    [
                        'run',
                        '--rm',
                        '-i',
                        '--name', `${userId}`,
                        '--memory', '128m',
                        '--cpus', '0.5',
                        '--pids-limit', '50',
                        '--network', 'none',
                        '-v', `${userDir}:/app`,
                        'dir-exe',
                        'node',
                        '/app/main.js'
                    ],
                    {
                        stdio: ['pipe', 'pipe', 'pipe']
                    }
                )

                activeDockerProcess = dockerProcess

                dockerProcess.stdout.on('data', (data) => {
                    websocket.send(JSON.stringify({ type: 'output', data: data.toString() }))
                })

                dockerProcess.stderr.on('data', (data) => {
                    websocket.send(JSON.stringify({ type: 'error', data: data.toString() }))
                })

                dockerProcess.on('error', (error) => {
                    console.error('Docker process error:', error)
                    websocket.send(JSON.stringify({ type: 'error', data: 'Failed to start Docker process' }))
                    if (activeDockerProcess === dockerProcess) {
                        activeDockerProcess = null
                    }
                })

                dockerProcess.on('close', () => {
                    if (activeDockerProcess === dockerProcess) {
                        activeDockerProcess = null
                    }
                })
            } catch (error) {
                console.error('Failed to run code:', error)
                websocket.send(JSON.stringify({ error: 'Failed to save code or start execution' }))
            }
        })








        // Connection Close & Delayed Cleanup
        websocket.on('close', () => {
            if (activeDockerProcess) {
                activeDockerProcess.kill()
            }

            // Grace period timeout before wiping out files and Redis records
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