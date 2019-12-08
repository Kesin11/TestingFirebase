import { firestore as admin_firestore } from "firebase-admin"
import * as firebase from '@firebase/testing'
import { readFileSync } from 'fs'
import { RestaurantAdminModel } from "../../src/restaurant"
import { ReviewAdminModel } from "../../src/review"

// FunctionsのエミュレータのprojectIdは.firebasercで定義されているものが使われる
// 本物のFirebaseプロジェクトのprojectIdと一致させないとFirestoreトリガーのFunctionsがエミュレータで発火されない
// TODO: 可能であればfirebase useした現在のprojectIdを自動的に取得したい
const projectId = `testing-firebase-test`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

const userIds = ['test-user1', 'test-user2']

const restaurantNames = [
  'Super burger',
  'Ramen nihon ichi',
  'Fire stake'
]

// user SDKとadmin SDKのFirestoreは型レベルでは別物だが、initializeAdminAppはuser SDKのFirestoreを返すので無理やりキャスト
const adminFirestore = firebase.initializeAdminApp({
  projectId
}).firestore() as unknown as admin_firestore.Firestore
const restaurantModel = new RestaurantAdminModel(adminFirestore)
const reviewModel = new ReviewAdminModel(adminFirestore)

describe('reviews', () => {
  let restaurantIds: string[] = []
  let restaurantId: string
  beforeAll(async () => {
    // エミュレータが起動され続けている場合に前のデータが残っている可能性あるため
    await firebase.clearFirestoreData({
      projectId
    })

    // ダミーのレストランを追加
    for (const name of restaurantNames) {
      const docRef = await restaurantModel.add(name)
      restaurantIds.push(docRef.id)
    }
    restaurantId = restaurantIds[0]
  })

  beforeEach(async () => {
  })

  afterAll(async () => {
    // firebaseとのlistnerを削除しないとテストが終了できない
    await Promise.all(firebase.apps().map(app => app.delete()))
  })

  afterEach(async () => {
    // Firestoreのデータを初期化
    await firebase.clearFirestoreData({
      projectId
    })
  })

  describe('when create reviews', () => {
    let unsubscribe: () => void
    // snapshotのsubscribeを解除
    afterEach(async () => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    test('functions calculate rate avg', async () => {
      const rates = [3, 5]
      reviewModel.set(restaurantId, {
        rate: rates[0],
        text: 'rating three',
        userId: userIds[0]
      })
      reviewModel.set(restaurantId, {
        rate: rates[1],
        text: 'rating five',
        userId: userIds[1]
      })

      const expectRateAvg = (rates[0] + rates[1]) / rates.length
      const expectRateNum = rates.length
      await new Promise((resolve => {
        unsubscribe = restaurantModel.collectionRef().doc(restaurantId).onSnapshot((snap) => {
          const data = snap.data()!
          // functionsが正しく動作すればrateNumが2, rateAvgが4になるはず
          // functionsは2回実行されるはずなので、そのうち1回でも望んだ結果が来ればOK
          if (data.rateNum === expectRateNum) {
            expect(data.rateAvg).toEqual(expectRateAvg)
            resolve()
          }
        })
      }))
    })
  })
})