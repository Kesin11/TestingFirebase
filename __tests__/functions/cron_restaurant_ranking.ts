import { firestore as admin_firestore, firestore } from "firebase-admin"
import * as firebase from '@firebase/testing'
import { readFileSync } from 'fs'
import { RestaurantAdminModel, Restaurant } from "../../src/restaurant"
import { PubSub } from '@google-cloud/pubsub'
import { RankingAdminModel } from "../../src/ranking"

// FunctionsのエミュレータのprojectIdは.firebasercで定義されているものが使われる
// 本物のFirebaseプロジェクトのprojectIdと一致させないとFirestoreトリガーのFunctionsがエミュレータで発火されない
// TODO: 可能であればfirebase useした現在のprojectIdを自動的に取得したい
const projectId = `testing-firebase-test`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

const dummyRestaurants: Restaurant[] = [
  {
    rateAvg: 3.5,
    rateNum: 3,
    name: 'Super buger',
  },
  {
    rateAvg: 4.1,
    rateNum: 10,
    name: 'Ramen nihon ichi',
  },
  {
    rateAvg: 2.8,
    rateNum: 7,
    name: 'Fire stake',
  },
]

const expectRankings = dummyRestaurants
  .sort((a, b) => b.rateAvg - a.rateAvg)
  .map((restaurant, index) => {
    return {
      rateAvg: restaurant.rateAvg,
      restaurantName: restaurant.name,
      rank: index + 1,
    }
  })

// user SDKとadmin SDKのFirestoreは型レベルでは別物だが、initializeAdminAppはuser SDKのFirestoreを返すので無理やりキャスト
const adminFirestore = firebase.initializeAdminApp({
  projectId
}).firestore() as unknown as admin_firestore.Firestore
const restaurantModel = new RestaurantAdminModel(adminFirestore)
const rankingModel = new RankingAdminModel(adminFirestore)

describe('cronRestaurantRanking', () => {
  const pubsub = new PubSub()
  let unsubscribe: () => void

  beforeAll(async () => {
    // エミュレータが起動され続けている場合に前のデータが残っている可能性あるため
    await firebase.clearFirestoreData({
      projectId
    })

    // ダミーのレストランを追加
    for (const restaurant of dummyRestaurants) {
      await restaurantModel.collectionRef().add(restaurant)
    }
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

    // snapshotのsubscribeを解除
    if (unsubscribe) {
      unsubscribe()
    }
  })

  test('trigger', async () => {
    await pubsub.topic('cron-restaurant-ranking').publishJSON({})

    // functions側の処理が完了するまで待つため、
    // rankがmaxになったsnapshotを観測するまで待つ
    await new Promise((resolve) => {
      unsubscribe = rankingModel.collectionRef().where('rank', '==', dummyRestaurants.length).onSnapshot((snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') resolve()
        })
      })
    })

    // /rankings のdocをrank順に取得し、比較用に配列に詰め直す
    const rankings: typeof expectRankings = []
    const snapshot = await rankingModel.getAllOrderByRank()
    snapshot.forEach((doc) => {
      const data = doc.data()
      rankings.push({
        rateAvg: data.rateAvg,
        restaurantName: data.restaurantName,
        rank: data.rank
      })
    })

    expect(rankings).toEqual(expectRankings)
  })
})
