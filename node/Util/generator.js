// var sequential = require("sequential-ids");
 
// var generator = new sequential.Generator({
//   digits: 3,
//   restore: "000"
// });


// generator.start();
exports.generator = function(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLM0123456789NOPQRSTUVWXYZabcdefghi0123456789jklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
  
  
  // module.exports = generator