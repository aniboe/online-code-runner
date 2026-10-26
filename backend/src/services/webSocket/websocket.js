import { WebSocketServer } from 'ws'

export function initWS(server){
    const wss = new WebSocketServer({server})
}
