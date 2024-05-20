const fs = require('fs');

exports.deleteImages = async (images) => {
    
    //console.log('images    ======>', images)

    for (let index = 0; index < images.length; index++) {
        const element = images[index].split('/').slice(-3).join('/');
      
        //console.log('imagename ->', element)

        fs.exists(element, function(exists) {
            if(exists) {
                //console.log('File exists. Deleting now ...');
                fs.unlink(element, (err) => {
                    if (err) {
                        throw err;
                    }
                    //console.log("Delete File successfully.");
                });
            } else {
            //console.log('File not found, so not deleting.');
            }
        });


    }

}