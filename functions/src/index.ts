import * as functions from 'firebase-functions'
import admin from 'firebase-admin'

const REVIEW_PATH = '/restaurants/{restaurantId}/ratings/{ratingId}'
admin.initializeApp(functions.config().firebase)
// const firestore = admin.firestore()

console.log('[functions] Start functions')

export const writeRestaurant = functions.firestore
  .document('/restaurants/{restaurandId}')
  .onWrite(async (change, context) => {
    console.log('[functions on: restaurants]', change.after.data())
    return
  })

export const updateRestaurantRating = functions.firestore
  .document(REVIEW_PATH)
  .onWrite(async (change, context) => {
    return console.log('[functions on: ratings]', change.after.data())
    // const review = snapshot.data()

    // const restaurantId = context.params.restaurantId
    // const restaurantRef = firestore.collection('/restaurant').doc(restaurantId)
    // const restaurant = await restaurantRef.get().then(doc => doc.data())
    // if (!review || !restaurant) return
    // // TODO: start tx
    // const newRateAvg = (restaurant.ratingAvg + review.rate) / (restaurant.reviewAvg + 1)
    // console.log(newRateAvg)
    // await restaurantRef.update({
    //   rateAvg: newRateAvg,
    //   reviewNum: restaurant.reviewNum + 1,
    // })
    // end tx

    // (1 + 3) / 2 = 2
    // (1 + 3 + 5) / 3 = 3
    // (4 + 5) / 3 = 3
    // (sum + b) / num + 1
})