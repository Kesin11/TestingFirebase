import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account.json'
import { insertUserFixutre } from '../src/test_util'

// 環境変数でprod, dev, testを切り替える仕組みが整っていればそれで判定してもOK
if (
  serviceAccount.project_id !== 'testing-firebase-dev' &&
  serviceAccount.project_id !== 'testing-firebase-test'
  ) {
  console.log(`project_id: ${serviceAccount.project_id}`)
  throw new Error('Insert dummy data allowed "dev" or "test" project only! Replace to test project service_account.json')
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