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

describe('ratings', () => {
  let userFirestore: firestore.Firestore
  let adminFirestore: admin_firestore.Firestore
  let restaurantUserModel: RestaurantUserModel
  let ratingUserModel: RatingUserModel

  beforeAll(async () => {
    userFirestore = firebase.initializeTestApp({
      projectId,
      auth: { uid }
    }).firestore()
    restaurantUserModel = new RestaurantUserModel(userFirestore)
    ratingUserModel = new RatingUserModel(userFirestore)

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
      const noAuthRatingUserModel = new RatingUserModel(noAuthFirestore)

      firebase.assertFails(noAuthRatingUserModel.getAll(restaurantId))
    })
  })

  describe('CRUD', () => {
    test('作成できる', async () => {
      const rating = {
        rating: 3,
        text: 'とても美味しいお店です',
        userId: uid,
      }
      await ratingUserModel.set(restaurantId, rating)
      const addedRating = await ratingUserModel.get(restaurantId, uid).then((doc) => doc.data())

      expect(addedRating).toEqual({
        ...rating,
        updatedAt: expect.any(firestore.Timestamp)
      })
    })

    test('編集できる', async () => {
      const rating = {
        rating: 3,
        text: 'とても美味しいお店です',
        userId: uid,
      }
      await ratingUserModel.set(restaurantId, rating)

      rating.text = 'とても美味しいお店です。追記：編集しました'
      const editRating = {
        ...rating,
        text: 'とても美味しいお店です 追記: 編集しました'
      }
      await ratingUserModel.set(restaurantId, editRating)
      const editedRating = await ratingUserModel.get(restaurantId, uid).then((doc) => doc.data())

      expect(editedRating).toEqual({
        ...editRating,
        updatedAt: expect.any(firestore.Timestamp)
      })
    })
  })

  describe('バリデーション', () => {
    test('自分以外のuser_idでは作成できない', async () => {
      const rating = {
        rating: 3,
        text: 'とても美味しいお店です',
        userId: 'hogehoge',
      }
      firebase.assertFails(ratingUserModel.set(restaurantId, rating))
    })

    test('負のrating', async () => {
      const rating = {
        rating: -1,
        text: 'とても美味しいお店です',
        userId: 'hogehoge',
      }
      firebase.assertFails(ratingUserModel.set(restaurantId, rating))
    })

    test('5以上のrating', async () => {
      const rating = {
        rating: 5,
        text: 'とても美味しいお店です',
        userId: 'hogehoge',
      }
      firebase.assertFails(ratingUserModel.set(restaurantId, rating))
    })
  })
})