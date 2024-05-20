var jwt      = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dotenv = require('dotenv');
dotenv.config();

exports.generateToken = (userId, email, username, userRoles, permeation)=>{
    var token = jwt.sign({
            userId:     userId,
            email:      email,
            name:       username,
            role:       userRoles,
            permeation: permeation
    } , process.env.SECRET , {expiresIn :"3d"})
    return token;
}

exports.generateBcryptHash = (password, salt) => {
    let bcryptHash = bcrypt.hash(password, salt)
    console.log("bcryptHash -------> : " + bcryptHash)
    return bcryptHash;
}

exports.compareBcryptHash = (password, savedPassword) => {
    let bcryptCompared = bcrypt.compare(password, savedPassword)
    return bcryptCompared;
}

exports.verifyToken = function(roles){
    return async (req, res, next) => {
        try {
            const {token} = req.headers;
            console.log("token : " + token)
            if(!token){
                console.log("No token exist");
                return res.status(500).send({error : 'Token is not exist'})
            }
            // should validate if loggedIn user has the same role
            var decode = jwt.verify(token , process.env.SECRET);
            console.log("decode:"  + JSON.stringify(decode))
            req.user = {
                userId:decode.userId,
                username:decode.username,
                email: decode.email,
                fullname:decode.fullname,
                roles:decode.roles,
                userType : roles.userType
            }
            console.log("roles : " + roles);
           
            if(!this.hasRole(roles , decode.roles)){
                console.log("Error : not have the same role");
                return res.status(401).send({error : 'Authentication failed'})
            }
            console.log("valid token");
            next();
        } catch (error) {
            next(error);
        }
            
    }
}

exports.hasRole = function(routeRoles , userRoles){
    console.log("routeRoles : " + routeRoles) 
    let result= false;
    userRoles.forEach(role => {
        if(routeRoles.includes(role)){
            result = true;
            return;
        }
    });
    console.log("result : " + result);
    return result;
}
