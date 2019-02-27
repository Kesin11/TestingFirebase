import firebase from 'firebase'
import config from '../firebase_config.json'
firebase.initializeApp(config)

const userConfig = {
  email: 'test@example.com',
  password: 'testtest'
}

const main = async () => {
  // 既存ユーザーでログイン
  // とりあえずUIでダミーユーザーを生成するが、これは将来jsやjsonで作成する
  await firebase.auth().signInWithEmailAndPassword(userConfig.email, userConfig.password)
  const user = await firebase.auth().currentUser
  if (user != null) {
    const userId = user.uid

    // 自分のFiresotreの情報read シークレット領域
    const db = firebase.firestore()
    const userLogin = await db.collection(`/users/${userId}/private`).doc('login').get().then(doc => doc.data())
    console.log(userLogin)

    // ログイン情報を更新
    userLogin!.num = userLogin!.num + 1
    userLogin!.lastDate = new Date()
    await db.collection(`/users/${userId}/private`).doc('login').set(userLogin!)
  }
  else {
    throw new Error('No User')
  }
}
main().then(() => {
  console.log('Finish!')
}).catch((err) => {
  console.error(err)
})