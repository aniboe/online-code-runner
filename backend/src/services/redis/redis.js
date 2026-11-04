import ioredis from 'ioredis'

const redis = new ioredis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
})

export default redis


// make this a proper file that can handel errors and send appropriate result
