import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const REVIEW_PATH = '/restaurants/{restaurantId}/reviews/{reviewId}'
admin.initializeApp(functions.config().firebase)
const firestore = admin.firestore()

console.log('[functions] Start functions')

export const updateRestaurantRate = functions.firestore
  .document(REVIEW_PATH)
  .onCreate(async (change, context) => {
    const review = change.data()
    const restaurantId = context.params.restaurantId
    if (!restaurantId) return

    // 現在のrateAvg, rateNumの取得->更新はアトミックである必要があるのでトランザクションで行う
    await firestore.runTransaction(async (tx) => {
      const restaurantRef = firestore.collection('/restaurants').doc(restaurantId)
      const restaurant = await tx.get(restaurantRef).then((doc) => doc.data())
      console.dir(restaurant)
      if (!review || !restaurant) return

      const newRateAvg = (restaurant.rateAvg + review.rate) / (restaurant.rateNum + 1)
      console.dir(newRateAvg)
      tx.update(restaurantRef, {
        rateAvg: newRateAvg,
        rateNum: restaurant.rateNum + 1,
      })
    })
})

export const pubsubFn = functions.pubsub.topic('test-topic').onPublish(async (msg, ctx) => {
  console.log('Received pubsub: test-topic');
  console.log('json', JSON.stringify(msg.json), 'attrs', JSON.stringify(msg.attributes));
  return true;
});

// エミュレータではschedule用のtopicが認識されないらしく、発火はできない
export const scheduledFunctionCrontab = functions.pubsub.schedule('5 11 * * *')
  .timeZone('Asia/Tokyo')
  .onRun((context) => {
    console.log('Received pubsub: firebase-schedule-scheduledFunctionCrontab-us-central1');
    console.log('json', JSON.stringify(context))
    return true
})
