import { firestore } from 'firebase'
import * as firebase from '@firebase/testing'
import uuid from 'uuid/v4'
import { readFileSync } from 'fs';

const projectId = `test-${uuid()}`
firebase.loadFirestoreRules({
  projectId,
  rules: readFileSync('firestore.rules', 'utf8')
})

let db: firestore.Firestore
let uid: string | undefined = undefined

describe('既存のダミーユーザーが', () => {
  beforeAll(async () => {
    uid = 'test-user'
    db = firebase.initializeTestApp({
      projectId,
      auth: { uid }
    }).firestore()
  })

  beforeEach(async () => {
    // 初期データ作成
    await db.collection(`/users/${uid}/private`).doc('login').set({
      num: 0,
      lastDate: new Date('1970/01/01')
    })
  })

  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()))
  })

  afterEach(async () => {
    // Firestoreのデータを初期化
    await firebase.clearFirestoreData({
      projectId
    })
  })

  test('ログイン情報にアクセスできる', async () => {
    const userLogin = await db.collection(`/users/${uid}/private`).doc('login').get().then(doc => doc.data())
    expect(userLogin!).toHaveProperty('num')
    expect(userLogin!).toHaveProperty('lastDate')
  });

  test('ログイン情報を更新できる', async () => {
    const now = new Date()
    // ログイン情報を更新
    await db.collection(`/users/${uid}/private`).doc('login').set({
      num: 1,
      lastDate: now,
    })

    const newUserLogin = await db.collection(`/users/${uid}/private`).doc('login').get().then(doc => doc.data())
    expect(newUserLogin!.num).toBe(1)
    expect(newUserLogin!.lastDate.toDate()).toEqual(now)
  })
})