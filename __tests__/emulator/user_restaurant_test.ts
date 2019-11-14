import { firestore as admin_firestore } from "firebase-admin"
import { firestore } from 'firebase'
import * as firebase from '@firebase/testing'
import uuid from 'uuid/v4'
import { readFileSync } from 'fs'
import { RestaurantUserModel, RestaurantAdminModel } from '../../src/restaurant'
import { RatingUserModel } from "../../src/rating"

// エミュレーターのメモリ空間はprojectId毎に分けられるので、テストスクリプト毎にユニークになるようにprojectIdをランダムにする
const projectId = `test-${uuid()}`
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

describe('restaurant', () => {
  let userFirestore: firestore.Firestore
  let adminFirestore: admin_firestore.Firestore
  let restaurantUserModel: RestaurantUserModel

  beforeAll(async () => {
    userFirestore = firebase.initializeTestApp({
      projectId,
      auth: { uid }
    }).firestore()
    restaurantUserModel = new RestaurantUserModel(userFirestore)

    // user SDKとadmin SDKのFirestoreは型レベルでは別物だが、initializeAdminAppはuser SDKのFirestoreを返すので無理やりキャスト
    adminFirestore = firebase.initializeAdminApp({
      projectId
    }).firestore() as unknown as admin_firestore.Firestore

  })

  let restaurantIds: string[] = []
  let restaurantId: string
  beforeEach(async () => {
    // ダミーのレストランを追加
    const restaurantModel = new RestaurantAdminModel(adminFirestore)
    for (const name of restaurantNames) {
      await restaurantModel.add(name)
    }
  })

    beforeEach(async () => {
      const snapshot = await restaurantUserModel.getAll()
      snapshot.forEach((doc) => restaurantIds.push(doc.id))
      restaurantId = restaurantIds[0]
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

  describe('未認証ユーザー', () => {
    test('readできない', async () => {
      const noAuthFirestore = firebase.initializeTestApp({
        projectId,
        auth: undefined,
      }).firestore()
      const noAuthRestaurantUserModel = new RestaurantUserModel(noAuthFirestore)

      firebase.assertFails(noAuthRestaurantUserModel.getAll())
    })
  })

  describe('CRUD', () => {
    test('取得できる', async () => {
      firebase.assertSucceeds(restaurantUserModel.getAll())
    })

    test('作成できない', async () => {
      const collectionRef = restaurantUserModel.collectionRef()
      firebase.assertFails(collectionRef.add({
        name: 'new restaurant'
      }))
    })

    test('編集できない', async () => {
      const docRef = restaurantUserModel.collectionRef().doc(restaurantId)
      firebase.assertFails(docRef.update({
        name: 'new restaurant'
      }))
    })

    test('削除できない', async () => {
      const docRef = restaurantUserModel.collectionRef().doc(restaurantId)
      firebase.assertFails(docRef.delete())
    })
  })
})
