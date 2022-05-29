/*
  dependencies
*/

const express = require('express')
let webpush = require('web-push')
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
config - web push
*/
webpush.setVapidDetails(
  'mailto:test@test.com',
  'BIxoTWzoYli__pdrvdX9lwAZPXEBjnSILFfitW41TTQjl3eChWw7CPuwt-q6j8yMfsMHjyxTMN6CLyzvPUYipn4',
  'UriNLc5uqikQKo-We_XwTvlnFF38x_TANYNOu8Jk8Dk'
)

/*
endpoint - posts
*/

app.get('/items', (request, response) => {
    response.set('Access-Control-Allow-Origin', '*')

    let items = []
    db.collection('items').orderBy('id', 'asc').get().then(snapshot => {
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
  db.collection('items').add(request.query).then(docRef => {
    sendPushNotification()
    response.send(request.query)
  })
})

function sendPushNotification() {
  let subscriptions =[]

  db.collection('subscriptions').get().then(snapshot => {
    snapshot.forEach((doc) => {
      subscriptions.push(doc.data())
    })

    return subscriptions
  }).then(subscriptions => {
    subscriptions.forEach(subscription => {
      let pushConfig = {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh
        }
      };

      let pushContent = {
        title: 'New item added!'
      }
      webpush.sendNotification(pushConfig, JSON.stringify(pushContent))
      console.log('Added completed')
    })
  })
}
/*
endpoint - createSubscription
*/

app.post('/createSubscription', (request, response) => {
  response.set('Access-Control-Allow-Origin', '*')
  db.collection('subscriptions').add(request.query).then(docRef => {
    response.send({
      message: 'Subscription added!',
      data: response.query
    })
  })

  
})

/*
listen
*/

app.listen(process.env.PORT || 3000)