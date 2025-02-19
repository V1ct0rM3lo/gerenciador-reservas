var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pjnodejs-1af82-default-rtdb.firebaseio.com"
  });

module.exports = admin;