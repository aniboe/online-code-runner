import path from 'path'
import fs from 'fs'
import { asyncHandler } from '../utils/AsyncHandler.js'
 
const testrouter = asyncHandler( // this controller makes a new js file if not exist 
    async(req, res) => {
        const runTimeRootPath = path.resolve("./PROJECT-SECSSIONS")
        console.log("this is form controller: ",runTimeRootPath);
        
        // fs.appendFileSync(`${runTimeRootPath}/test.js`,"console.log('hello\n')",'utf-8')
        fs.writeFileSync (`${runTimeRootPath}/test.js`,"console.log('hello')\n",'utf-8')

        res
        .status(200)
        .send("created")
    }
)



export { testrouter }


// a file to handel mulple project when new user connect it should cerate a new directory for user for now lets have one file in that 
// directroy to test