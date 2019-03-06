# TestingFirebase
Firebaseのプロジェクトを本格的にテストするサンプル

# プロジェクト構成
開発用のdev、テスト用のtestのFirebaseプロジェクトが別々に分かれている想定。　　
開発はdevで行い、CIでのテストをtestで行う。

プロジェクトの切り替えは`firebase use dev`, `firebase use test`で行う。  
ただ、ダミーデータを用意するためのscripts/の各種スクリプトは`service_account.json`, `firebase_config.json`で接続先が切り替わる。

.gitignoreに追加してあるため、ローカル環境にはdevプロジェクトのものをダウンロードして配置、CI環境ではbase64エンコードしたtestプロジェクトのものを復元して使用する。

# CI用のtestプロジェクトの制約と事前準備
本当はCIでテストする毎にAPIで新しいFirebaseプロジェクトを作成、破棄することで独立した環境を用意できたらベストだったが、以下の理由で不可能だった。

- Firestoreを有効化してFirebaseプロジェクトに紐付けるためには、FirebaseのWebUIからFirestoreを有効化する必要がある。（APIが存在しなかった）
- FirebaseのAuthでメールアドレス認証を有効化するには、FirebaseのWebUIから有効化する必要がある。（APIが存在しなかった）

現状では手動操作がどうしても必要なため、testプロジェクトは1つだけ用意して手動で上記のセットアップを事前にしておく。　　
そのため、CI環境で並列でテストを走らせるとコンフリクトしてしまうので、現状では同時にテストが走らないように制御する必要がある。

# Auth
ユーザーが既にサービスにいる状態を再現するため、devプロジェクトで`firebase auth:export`でユーザーデータを書き出しておく。
テスト時はtestプロジェクトで`firebase auth:import`することでユーザーデータを読み込む。

書き出されたユーザーデータのパスワードはハッシュ化されているため、テストスクリプトで既存ユーザーのログインに使用するための生パスワードは別途どこかで保存しておく必要がある。  
現在はsrc/test_utils.tsの中にべた書きでテスト用ユーザーのemailとpasswordを保存している。

# Firestoreエミュレータ

# Firestore
## 既存ユーザーのためのデータ
Authの項目で説明した既存ユーザーはuserIdが固定されているため、そのユーザーに対応するデータをテスト前にFirestoreに用意することが可能である。
理想は[インポート機能](https://firebase.google.com/docs/firestore/manage-data/export-import)を使用してGCSからデータをロードすることだが、Firebaseの課金プランを有効化する必要があるため今回は見送っている。

代わりにscripts/insert_dummmy_data.tsにて既存ユーザーのuserIdに対応したデータを用意している。

# CIパイプライン
[CircleCIの設定](./.circleci/config.yml)参照