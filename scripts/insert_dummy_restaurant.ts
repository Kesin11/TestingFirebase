import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account.json'
import { RestaurantAdminModel } from '../src/restaurant'

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})

const restaurantNames = [
  'Super burger',
  'Ramen nihon ichi',
  'Fire stake'
]

const main = async () => {
  const firestore = admin.firestore()
  const restaurantModel = new RestaurantAdminModel(firestore)

  for (const name of restaurantNames) {
    await restaurantModel.add(name)
  }

  const snapshot = await restaurantModel.getAll()
  snapshot.forEach((doc) => console.log(doc.data()))
}

main().then(() => {
  app.delete()
})