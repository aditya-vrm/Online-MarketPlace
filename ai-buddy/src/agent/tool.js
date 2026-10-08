const {tool}=require('@langchain/core/tools');
const {z}=require('zod');
const axios=require('axios');

const searchProduct=tool(async({query,token})=>{

    const response=await axios.get(`http://localhost:3001/api/products?q=${query}`,{
        headers:{
            'Authorization': `Bearer ${token}`
        }
        });

        return JSON.stringify(response.data);
},{
    name:'search-product',
    description:'Search for a product in the online marketplace',
    schema:z.object({
        query:z.string().describe('The search query for the product')
    })
});

const addProductToCart=tool(async({productId,qty=1,token})=>{

    const response=await axios.post(`http://localhost:3002/api/cart/items`,{
        productId,
        qty
    },{
        headers:{
            'Authorization': `Bearer ${token}`
        }
    });

    return `Added Product with ID ${productId} and quantity ${qty} to the cart.`;
},{
    name:'add-product-to-cart',
    description:'Add a product to the user\'s cart in the online marketplace',
    schema:z.object({
        productId:z.string().describe('The ID of the product to add to the cart'),
        qty:z.number().describe('The quantity of the product to add to the cart').default(1),
    })
});

module.exports = {
    'search-product': searchProduct,
    'add-product-to-cart': addProductToCart
};

