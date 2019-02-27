import firebase, { firestore } from 'firebase'
import config from '../firebase_config.json'
import { generateRandomUserConfig } from '../src/test_util'

// 元々存在しているユーザーがauthで認証でき、ログインに相当する自分のFirestoreの変更ができるかのテスト
// テスト用の新しいユーザーがサインアップ、テスト後にデータを削除する

const userConfig = generateRandomUserConfig()
let user: firebase.User | null
let db: firestore.Firestore
let userId: string | undefined = undefined

describe('新規のユーザーが', () => {
  beforeAll(async () => {
    firebase.initializeApp(config)
    db = firebase.firestore()
    await firebase.auth().createUserWithEmailAndPassword(userConfig.email, userConfig.password)
    user = await firebase.auth().currentUser
    userId = user!.uid
  })

  afterAll(async () => {
    // このテストのみのユーザーなので削除する
    if (user && userId) {
      await user.delete()
      // コレクションがネストされている場合は上だけを削除しても再帰的に削除はされない
      await db.collection(`/users/${userId}/private`).doc('login').delete()
      await db.collection('/users').doc(userId).delete()
    }
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
    await db.collection(`/users/${userId}/private`).doc('login').set({
      num: 1,
      lastDate: now,
    })

    const newUserLogin = await db.collection(`/users/${userId}/private`).doc('login').get().then(doc => doc.data())
    expect(newUserLogin!.num).toBe(1)
    expect(newUserLogin!.lastDate.toDate()).toEqual(now)
  });
});