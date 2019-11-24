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

  console.log(`published test-topic: ${JSON.stringify(msg)}`)

  const msg2 = await pubsub.topic('cron-restaurant-ranking').publishJSON({})
  console.log(`published cron-restaurant-trigger: ${JSON.stringify(msg2)}`)

  // エミュレータではschedule用のtopicが認識されないらしく、エラーになる
  // const msgCron = await pubsub.topic('firebase-schedule-scheduledFunctionCrontab-us-central1').publishJSON({})
  // console.log(`published firebase-schedule-scheduledFunctionCrontab-us-central1: ${JSON.stringify(msgCron)}`)
}

main().then(() => {
  app.delete()
})