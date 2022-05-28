/*
  dependencies
*/

const express = require('express')

/*
config - express
*/

const app = express()

/*
config - firebase
*/
var admin = require("firebase-admin");

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
/*
endpoint - posts
*/

app.get('/items', (request, response) => {
    response.set('Access-Control-Allow-Origin', '*')

    let items = []
    db.collection('tasks').orderBy('id', 'asc').get().then(snapshot => {
        snapshot.forEach((doc) => {
            items.push(doc.data())
        });
        response.send(items)
    })
})

/*
endpoint - createPost
*/

app.post('/createItem', (request, response) => {
  response.set('Access-Control-Allow-Origin', '*')

  request.query.id = parseInt(request.query.id)
  db.collection('tasks').add(request.query)

  response.send(request.query)
})
/*
listen
*/

app.listen(process.env.PORT || 3000)