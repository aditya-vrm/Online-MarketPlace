require('dotenv').config();
const { config } = require('dotenv');
const app=require('./src/app')
const connectDB=require('./src/db/db') 
const {connect}=require('./src/borker/borker')

connectDB();
connect();

app.listen(3004,()=>{
    console.log('Payment Server is running on port 3004')
})