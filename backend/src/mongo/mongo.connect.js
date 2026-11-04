import mongoose from 'mongoose'

export const connectMongo = async () => {
    const uri = process.env.MONGODB_URI

    if(!uri){
        console.error('ERROR: could not find mongo connection uri')
    }

    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI)
        console.log('DB connection : ',connection.connection.host);
        
        // logger.info('Connected to MongoDB') // what does it do
    } catch (error) {
        console.error('Unexpected error:', error)
        process.exit(1)
    }
}




// export const dbConnect = async() => {
//     const uri = process.env.DB_URI || `${process.env.DB_CONNECT || ""}${process.env.DB_NAME || ""}`
//     if(!uri){
//         console.error("No DB URI provided. Set DB_URI or DB_CONNECT+DB_NAME env vars.")
//         process.exit(1)
//     }
//     try {
//         const conn = await mongoose.connect(uri, {
//             // recommended options can be added here
//         })
//         console.log("Connected to DB host:", conn.connection.host)
//         return conn
//     } catch (error) {
//         console.error("DB connection failed:", error.message)
//         console.error(error)
//         console.error("server will shut down since no database found")
//         process.exit(1) // exits and quits whole server
//     }
// }