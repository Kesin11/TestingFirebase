import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account.json'

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://testing-firebase-9d0aa.firebaseio.com"
})

const main = async () => {
  const db = admin.firestore()

  const listUsersResult = await admin.auth().listUsers()
  listUsersResult.users.forEach(async (userRecord) => {
    const uid = userRecord.uid

    await db.collection(`/users/${uid}/private`).doc('login').set({
      num: Math.round(Math.random() * 100),
      lastDate: new Date()
    })
  })
}

main().then(() => {
  app.delete()
})