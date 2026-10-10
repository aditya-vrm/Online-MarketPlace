const mongoose=require('mongoose');

const AddressSchema=new mongoose.Schema({
    street:{
        type:String,
    },
    city:{
        type:String,
    },
    state:{
        type:String,
    },
    country:{
        type:String,
    },
    pincode:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
        required:true,
    },
    isDefault:{
        type:Boolean,
        default:false
    }
});

const FullnameSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true,
    },
    lastname: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    fullname: {
        type: FullnameSchema,
        required: true,
    },
    password:{
        type:String,
        select:false,
    },
    role:{
        type:String,
        enum:['user','seller'],
        default:'user'
    },
    addresses: [AddressSchema],
});

const userModel=mongoose.model('user',userSchema);

module.exports=userModel;