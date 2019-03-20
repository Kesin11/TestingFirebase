import firebase, { firestore } from 'firebase'
import config from '../../firebase_config.json'
import { generateRandomUserConfig } from '../../src/test_util'

// 元々存在しているユーザーがauthで認証でき、ログインに相当する自分のFirestoreの変更ができるかのテスト
// テスト用の新しいユーザーがサインアップ、テスト後にデータを削除する

const userConfig = generateRandomUserConfig()

describe('新規のユーザーが', () => {
  let db: firestore.Firestore
  let user: firebase.User | null
  let uid: string | undefined = undefined
  beforeAll(async () => {
    firebase.initializeApp(config)
    db = firebase.firestore()
    await firebase.auth().createUserWithEmailAndPassword(userConfig.email, userConfig.password)
    user = await firebase.auth().currentUser
    uid = user!.uid
  })

  afterAll(async () => {
    // このテストのみのユーザーなので削除する
    if (user && uid) {
      await user.delete()
      // コレクションがネストされている場合は上だけを削除しても再帰的に削除はされない
      await db.collection(`/v/0/users/${uid}/private`).doc('login').delete()
      await db.collection('/v/0/users').doc(uid).delete()
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
    await db.collection(`/v/0/users/${uid}/private`).doc('login').set({
      num: 1,
      lastDate: now,
    })

    const newUserLogin = await db.collection(`/v/0/users/${uid}/private`).doc('login').get().then(doc => doc.data())
    expect(newUserLogin!.num).toBe(1)
    expect(newUserLogin!.lastDate.toDate()).toEqual(now)
  });
});