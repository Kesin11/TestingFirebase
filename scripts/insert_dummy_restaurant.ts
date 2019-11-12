import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account.json'
import { RestaurantModel } from '../src/restaurant'

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://testing-firebase-9d0aa.firebaseio.com"
})

const restaurantNames = [
  'Super burger',
  'Ramen nihon ichi',
  'Fire stake'
]

const main = async () => {
  const firestore = admin.firestore()
  const restaurantModel = new RestaurantModel(firestore)

  for (const name of restaurantNames) {
    await restaurantModel.add(name)
  }

  const snapshot = await restaurantModel.getAll()
  snapshot.forEach((doc) => console.log(doc.data()))
}

main().then(() => {
  app.delete()
})