const jwt = require('jsonwebtoken');

function createAuthMiddleware(roles = []) {
    return async function authMiddleware(req, res, next) {
    const token = req.cookies?.token||req.headers?.authorization?.split(' ')[1];
    if(!token){
        return res.status(401).json({message:'Unauthorized'});
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        if(!roles.includes(decoded.role)){
            return res.status(403).json({message:'Forbidden'});
        }

        const userId = decoded._id || decoded.userId || decoded.id || decoded.sub;
        if (!userId) {
            return res.status(401).json({ message: 'Token does not contain a user id' });
        }

        req.user = { ...decoded, _id: userId };
        next();
    }catch(err){
        return res.status(401).json({message:'Unauthorized'});
    }
    };
}

module.exports=createAuthMiddleware;