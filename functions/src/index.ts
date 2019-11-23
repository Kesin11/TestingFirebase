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