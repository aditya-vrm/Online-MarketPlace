const {subscribeToQueue}=require('../borker/borker')
const userModel=require('../Model/user.model')
const productModel=require('../Model/product.model')
const orderModel=require('../Model/order.model')
const paymentModel=require('../Model/payment.model');
module.exports=async function(){

    subscribeToQueue('AUTH_SELLER_DASHBOARD.USER_CREATED',async (user)=>{
        await userModel.create(user)
    })

    subscribeToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED',async(product)=>{
        await productModel.create(product)
    })

    subscribeToQueue('ORDER_SELLER_DASHBOARD.ORDER_CREATED',async(order)=>{
        await orderModel.create(order)
    })

    subscribeToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED',async(payment)=>{
        await paymentModel.create(payment)
    })

    subscribeToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED',async(payment)=>{
        await paymentModel.findOneAndUpdate({orderId:payment.orderId},{...payment})
    })

}


    