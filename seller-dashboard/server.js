require('dotenv').config()
const app=require("./src/app")
const connectDB=require("./src/db/db")
const listner=require('./src/borker/listner')
const {connect}=require('./src/borker/borker')

connectDB();

connect().then(()=>{
    listner()
})

app.listen('3007',()=>{
    console.log(`Seller-Dashboard Server is running on port 3007`)
})