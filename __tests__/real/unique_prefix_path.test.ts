import uuid from 'uuid/v4'
import firebase, { firestore } from 'firebase'
import config from '../../firebase_config.json'
import { generateRandomUserConfig } from '../../src/test_util'

// 本物のFirestoreを使う場合に別のテストスクリプトと依存しないようにランダムなprefixでデータを分離する方法

const prefix = `test-${uuid()}`

const userConfig = generateRandomUserConfig()
let user: firebase.User | null
let db: firestore.Firestore
let userId: string | undefined = undefined

describe('テストスクリプト毎に隔離されたコレクションで', () => {
  describe('新規のユーザーが', () => {
    beforeAll(async () => {
      firebase.initializeApp(config)
      db = firebase.firestore()
      await firebase.auth().createUserWithEmailAndPassword(userConfig.email, userConfig.password)
      user = await firebase.auth().currentUser
      userId = user!.uid
    })

    afterAll(async () => {
      // prefixがランダムなのでダミーデータは他のテストスクリプトに影響を与えない
      // CIでのテスト実行時には初期化されるので、/v/0/で固定していたときと異なり明示的に削除する必要はない

      // firebaseが裏でコネクションを貼っている（？）のでjestが終了できない
      // 明示的にappを閉じておく
      firebase.app().delete()
    })

    test('作成されていること', () => {
      expect(user).toBeTruthy()
      expect(user!.email).toBe(userConfig.email)
    })

    test('ログイン情報を更新できる', async () => {
      const now = new Date()
      // ログイン情報を更新
      await db.collection(`/v/${prefix}/users/${userId}/private`).doc('login').set({
        num: 1,
        lastDate: now,
      })

      const newUserLogin = await db.collection(`/v/${prefix}/users/${userId}/private`).doc('login').get().then(doc => doc.data())
      expect(newUserLogin!.num).toBe(1)
      expect(newUserLogin!.lastDate.toDate()).toEqual(now)
    })
  })
})