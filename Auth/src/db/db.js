const mongoose=require('mongoose');

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Database connected")
    }catch(err){
        console.log("Database not connected",err)
    }
}

module.exports=connectDB;