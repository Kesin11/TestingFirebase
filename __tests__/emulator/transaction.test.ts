import * as firebase from '@firebase/testing'
import uuid from 'uuid/v4'
import { readFileSync } from 'fs'

// エミュレータでトランザクション処理がちゃんと実現されているかの確認

// エミュレーターのメモリ空間はprojectId毎に分けられるので、テストスクリプト毎にユニークになるようにprojectIdをランダムにする
const projectId = `test-${uuid()}`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

const myUid = 'my'
const otherUid = 'other'

const myDb = firebase.initializeTestApp({
  projectId,
  auth: { uid: myUid }
}).firestore()
const otherDb = firebase.initializeTestApp({
  projectId,
  auth: { uid: otherUid }
}).firestore()

describe('トランザクション', () => {
  const beforeNickname = 'before_transaction'
  const afterNickname = 'after_transaction'

  beforeEach(async () => {
    // 初期データ作成
    await myDb.collection(`/v/0/users`).doc(myUid).set({
      userId: myUid,
      nickname: beforeNickname
    })
  })

  afterEach(async () => {
    // Firestoreのデータを初期化
    await firebase.clearFirestoreData({
      projectId
    })
  })

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()))
  })

  describe('コミット前後で', () => {
    test('他人はコミット前に更新後のデータを確認できない', async () => {
      await myDb.runTransaction(async (tx) => {
        tx.update(myDb.collection('/v/0/users').doc(myUid), {
          nickname: afterNickname
        })
        const user = await otherDb.collection('/v/0/users').doc(myUid).get()
        expect(user.data()!.nickname).toBe(beforeNickname)
      })
    })

    test('他人はコミット後に更新後のデータを確認できる', async () => {
      await myDb.runTransaction(async (tx) => {
        tx.update(myDb.collection('/v/0/users').doc(myUid), {
          nickname: afterNickname
        })
      })
      const user = await otherDb.collection('/v/0/users').doc(myUid).get()
      expect(user.data()!.nickname).toBe(afterNickname)
    })
  })

  describe('失敗した場合に', () => {
    test('自分も他人はコミット前のデータの状態に戻っている', async () => {
      await myDb.runTransaction(async (tx) => {
        tx.update(myDb.collection('/v/0/users').doc(myUid), {
          nickname: afterNickname
        })

        return Promise.reject('Transaction failed and rollback')
      }).catch((_err) => {})

      let user = await myDb.collection('/v/0/users').doc(myUid).get()
      expect(user.data()!.nickname).toBe(beforeNickname)

      user = await otherDb.collection('/v/0/users').doc(myUid).get()
      expect(user.data()!.nickname).toBe(beforeNickname)
    })
  })
})