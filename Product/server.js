require('dotenv').config();
const app=require('./src/app');
const connectDB=require('./src/db/db');
const{connect}=require('./src/borker/borker');

connectDB();
connect();


app.listen(3001,()=>{
    console.log('Product Server is running on port 3001');
});