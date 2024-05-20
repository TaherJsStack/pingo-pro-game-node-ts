const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // console.log('req.headers.authorization.split(" ")[1] =>', req.headers.authorization);

        // 'authorization' created by me i can use any word else
        // must receive like req.headers.set('Authorization', 'Bearer ' + authToken)
        // we get this from services/auth-interceptor.ts
        const token = req.headers.authorization.split(" ")[1];
        // jwt.verify(token, 'secret_this_should_be_longer');
        // console.log('token =>', token);
        const decodedToken = jwt.verify(token, 'secret_this_should_be_longer');
        req.authData = { 
                // name:       decodedToken.name, 
                email:      decodedToken.email, 
                id:         decodedToken.userId, 
                role:       decodedToken.role,
                permeation: decodedToken.permeation 
            }

        next();
    } catch (e) {
        res.status(401).json({
            message: 'middleware ::: '+ e
        })
    }

}