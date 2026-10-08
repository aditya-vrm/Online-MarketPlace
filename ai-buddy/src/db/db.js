const mongoose=require('mongoose')

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log('Database connected successfully')
    }catch(err){
        console.log('Error while connecting to database',err)
    }
}

module.exports=connectDB