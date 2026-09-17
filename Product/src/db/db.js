const mongoose=require('mongoose');

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log('MongoDB connected successfully');
    }catch(err){
        console.log('MongoDB connection failed');
        console.error(err);
    }
}

module.exports=connectDB;