import { firestore as admin_firestore } from "firebase-admin"
import { firestore } from 'firebase'
import * as firebase from '@firebase/testing'
import uuid from 'uuid/v4'
import { readFileSync } from 'fs'
import { RestaurantUserModel, RestaurantAdminModel } from '../../src/restaurant'
import { ReviewUserModel } from "../../src/review"

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

describe('reviews', () => {
  let userFirestore: firestore.Firestore
  let adminFirestore: admin_firestore.Firestore
  let restaurantUserModel: RestaurantUserModel
  let reviewUserModel: ReviewUserModel

  beforeAll(async () => {
    userFirestore = firebase.initializeTestApp({
      projectId,
      auth: { uid }
    }).firestore()
    restaurantUserModel = new RestaurantUserModel(userFirestore)
    reviewUserModel = new ReviewUserModel(userFirestore)

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
      const noAuthReviewUserModel = new ReviewUserModel(noAuthFirestore)

      firebase.assertFails(noAuthReviewUserModel.getAll(restaurantId))
    })
  })

  describe('CRUD', () => {
    test('作成できる', async () => {
      const review = {
        rate: 3,
        text: 'とても美味しいお店です',
        userId: uid,
      }
      await reviewUserModel.set(restaurantId, review)
      const addedReview = await reviewUserModel.get(restaurantId, uid).then((doc) => doc.data())

      expect(addedReview).toEqual({
        ...review,
        updatedAt: expect.any(firestore.Timestamp)
      })
    })

    test('編集できる', async () => {
      const review = {
        rate: 3,
        text: 'とても美味しいお店です',
        userId: uid,
      }
      await reviewUserModel.set(restaurantId, review)

      review.text = 'とても美味しいお店です。追記：編集しました'
      const editReview = {
        ...review,
        text: 'とても美味しいお店です 追記: 編集しました'
      }
      await reviewUserModel.set(restaurantId, editReview)
      const editedReview = await reviewUserModel.get(restaurantId, uid).then((doc) => doc.data())

      expect(editedReview).toEqual({
        ...editReview,
        updatedAt: expect.any(firestore.Timestamp)
      })
    })
  })

  describe('バリデーション', () => {
    const base = {
      rate: 3,
      text: 'とても美味しいお店です',
      userId: uid,
    }
    test('自分以外のuser_idでは作成できない', async () => {
      const review = {
        ...base,
        userId: 'hogehoge',
      }
      firebase.assertFails(reviewUserModel.set(restaurantId, review))
    })

    describe('rateが', () => {
      test('負 NG', async () => {
        const review = {
          ...base,
          rate: -1,
        }
        firebase.assertFails(reviewUserModel.set(restaurantId, review))
      })

      test('0 NG', async () => {
        const review = {
          ...base,
          rate: 0,
        }
        firebase.assertFails(reviewUserModel.set(restaurantId, review))
      })

      test('1 OK', async () => {
        const review = {
          ...base,
          rate: 1,
        }
        firebase.assertSucceeds(reviewUserModel.set(restaurantId, review))
      })

      test('5 OK', async () => {
        const review = {
          ...base,
          rate: 1,
        }
        firebase.assertSucceeds(reviewUserModel.set(restaurantId, review))
      })

      test('5より大きい NG', async () => {
        const review = {
          ...base,
          rate: 6,
        }
        firebase.assertFails(reviewUserModel.set(restaurantId, review))
      })
    })
  })
})