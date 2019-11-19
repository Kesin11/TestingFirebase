import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account.json'
import { RestaurantAdminModel, Restaurant } from '../src/restaurant'
import { FieldValue } from '@google-cloud/firestore'

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})

const restaurantNames = [
  'Super burger',
  'Ramen nihon ichi',
  'Fire stake'
]

const randomRate = () => {
  const min = Math.ceil(1)
  const max = Math.floor(5)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const main = async () => {
  const firestore = admin.firestore()
  const restaurantModel = new RestaurantAdminModel(firestore)
  let snapshot = await restaurantModel.getAll()
  const restaurantIds: string[] = []
  snapshot.forEach((doc) => restaurantIds.push(doc.id))

  for (const id of restaurantIds) {
    const dummyUid = Math.random().toString(36).slice(-8)
    const ref = firestore.collection(`/restaurants/${id}/ratings`).doc(dummyUid)
    await ref.set({
      rating: randomRate(),
      text: 'test',
      userId: dummyUid,
      updatedAt: FieldValue.serverTimestamp()
    }) 

    const ratingSnapshot = await firestore.collection(`/restaurants/${id}/ratings`).get()
    console.log('restaurant:', id)
    ratingSnapshot.forEach((doc) => console.log(doc.data()))
  }

  snapshot = await restaurantModel.getAll()
  snapshot.forEach((doc) => console.log(doc.data()))
}

main().then(() => {
  app.delete()
})