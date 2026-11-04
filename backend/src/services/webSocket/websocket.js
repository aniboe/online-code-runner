import { WebSocketServer } from 'ws'
import crypto from 'crypto'
import fs from 'fs'
import { verifyToken } from '../../utils/Auth-JWT.js'
import path from 'path'
import { ApiError } from '../../utils/ApiError.js'
import redis from '../redis/redis.js'


// import * as cookie from 'cookie';

// const uid = crypto.randomUUID()
// console.log('new connection established with id: ', uid);

// const userDir = `./PROJECT-SECSSIONS/${uid}`
// fs.mkdirSync(userDir, {recursive: true})
// console.log('user directory created at: ', userDir);

// fs.writeFileSync(`${userDir}/main.js`, 'console.log("Hello World!");')

// websocket.on('message', (message) => {
//     console.log('message received: ', message.toString())
//     // handle the message here
// })

// // when connection is closed, delete the user directory
// websocket.on('close', () => {
//     console.log('connection closed for id: ', uid);
//     fs.rmSync(userDir, {recursive: true, force: true})
//     console.log('user directory deleted at: ', userDir);
// })



export function initWS(server){
    const webSocketInstence = new WebSocketServer({server})

    webSocketInstence.on('connection', async(websocket, req) => {

        console.log("connected successfully");

        // const cookies = websocket.upgradeReq.headers.cookie // old appreantly
        const cookies =  req.headers.cookie 
        console.log('cookies: ', cookies);
        
        // websocket.on('message', (message) => {
        //     console.log("message recieved : ", message.toString());
            
        // })

        const token = cookies.slice(cookies.indexOf('=') + 1)

        if(!token){
            websocket.send(JSON.stringify({error: 'invalid token/missing token'}))
        }
        
        // let validateTokenWithData
        // verifyToken(token)
        // .then((value) => {
        //     console.log(value);
        //     validateTokenWithData = value
            
        // })
        // .catch((err) => {
        //     throw new ApiError(400, err || 'invalid token')
        // })
        

        

        
        const validateTokenWithData = await verifyToken(token)
        if(validateTokenWithData.length === 0 || validateTokenWithData === undefined || !validateTokenWithData){
            websocket.send(JSON.stringify({error: 'invalid token'}))
        }




        const randomFolderName = crypto.randomUUID()
        const serverProjectRootFolder = path.resolve('./PROJECT-SECSSIONS')
        const userDir = path.join(serverProjectRootFolder, randomFolderName)
        fs.mkdirSync(`${serverProjectRootFolder}/${randomFolderName}`)


        if(validateTokenWithData){
            // console.log('resolved path : ',serverProjectRootFolder);

            // before doing this chek if this user is asociated with any other runing folder (user id as key and folder name as data)
            await redis.hset(randomFolderName, validateTokenWithData) // saves foldr name and userdata
            
            
            
            // start dockercontainer and connect with xterm

            websocket.on('close', () => {
                fs.rmdirSync(userDir)
            })

            
        }
        else{
        }
        
        
        
        
    })
    
}
