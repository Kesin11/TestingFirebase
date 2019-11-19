import { firestore as admin_firestore } from "firebase-admin"
import * as firebase from '@firebase/testing'
import { readFileSync } from 'fs'
import { RestaurantAdminModel } from "../../src/restaurant"

// FunctionsのエミュレータのprojectIdは.firebasercで定義されているものが使われる
// 本物のFirebaseプロジェクトのprojectIdと一致させないとFirestoreトリガーのFunctionsがエミュレータで発火されない
// TODO: 可能であればfirebase useした現在のprojectIdを自動的に取得したい
const projectId = `testing-firebase-test`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

const uid = 'test-user'

const restaurantNames = [
  'Super burger',
  'Ramen nihon ichi',
  'Fire stake'
]

describe('ratings', () => {
  let adminFirestore: admin_firestore.Firestore

  beforeAll(async () => {
    // user SDKとadmin SDKのFirestoreは型レベルでは別物だが、initializeAdminAppはuser SDKのFirestoreを返すので無理やりキャスト
    adminFirestore = firebase.initializeAdminApp({
      projectId
    }).firestore() as unknown as admin_firestore.Firestore

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

  describe('restaurants.create', () => {
    test('trigger', async () => {
      // ダミーのレストランを追加
      const restaurantModel = new RestaurantAdminModel(adminFirestore)
      for (const name of restaurantNames) {
        await restaurantModel.add(name)
      }

      await new Promise((resolve) => {
        restaurantModel.collectionRef().onSnapshot((snapshot) => {
          resolve()
        })
      })
    })
  })
})