import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account_test.json'

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})

const main = async () => {
  const listUsersResult = await admin.auth().listUsers()
  const deleteUserPromises = listUsersResult.users.map((userRecord) => {
    const uid = userRecord.uid
    console.debug(`Delete user: ${uid}`)
    return admin.auth().deleteUser(uid)
  })

  await Promise.all(deleteUserPromises)
}

main().then(() => {
  app.delete()
})