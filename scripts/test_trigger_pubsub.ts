import admin, { ServiceAccount } from 'firebase-admin'
import serviceAccount from '../service_account_test.json'
import { PubSub } from '@google-cloud/pubsub'

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})

const restaurantNames = [
  'Super burger',
  'Ramen nihon ichi',
  'Fire stake'
]

const pubsub = new PubSub()

const main = async () => {
  console.log("Pubsub Emulator:", process.env.PUBSUB_EMULATOR_HOST);
  if (!process.env.PUBSUB_EMULATOR_HOST) {
    throw "Need export env: PUBSUB_EMULATOR_HOST"
  }

  const msg = await pubsub.topic('test-topic').publishJSON({
      foo: 'bar',
      date: new Date()
  }, { attr1: 'value' });

  console.log(`published: ${JSON.stringify(msg)}`)
}

main().then(() => {
  app.delete()
})