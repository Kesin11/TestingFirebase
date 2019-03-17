import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account.json'
import { insertUserFixutre } from '../src/test_util'

if (serviceAccount.project_id !== 'testing-firebase-test') {
  throw new Error('Insert dummy data allowed test project only! Replace to test project service_account.json')
}

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://testing-firebase-9d0aa.firebaseio.com"
})

const main = async () => {
  const db = admin.firestore()

  const listUsersResult = await admin.auth().listUsers()
  const uids = listUsersResult.users.map((userRecord) => userRecord.uid)
  await insertUserFixutre(db, '0', uids)
}

main().then(() => {
  app.delete()
})