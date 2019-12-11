# TestingFirebase
[![CircleCI](https://circleci.com/gh/Kesin11/TestingFirebase/tree/master.svg?style=svg)](https://circleci.com/gh/Kesin11/TestingFirebase/tree/master)

FirebaseプロジェクトをEmulator Suite(Firestore, Cloud Functions, PubSub)によるエミュレータを使ってテストするサンプルリポジトリ

# USAGE
```sh
# 別ウィンドウでエミュレータを立ち上げておく
npm run emulators:start
# テスト実行
npm run test

# もしくはエミュレータの起動・終了とテストをセットで実行できる
npm run test:ci
```

TDDで開発する場合は、jest --watchの状態でテストを裏で実行しておくのが便利。

```sh
# 別ウィンドウでエミュレータを立ち上げておく
npm run emulators:start
# さらに別ウィンドウでfunctions/index.tsのためにtsc --watchを立ち上げる
npm --prefix functions run build:watch
# jest --watch相当
npm run test:watch
```


# Firebaseプロジェクトの構成
開発用のdev、テスト用のtestとFirebaseプロジェクトが別々に分かれている想定。  
開発はdevで行い、CIでのテストをtestで行う。

プロジェクトの切り替えは `firebase use dev` と `firebase use test`

# テスト
## Firestore
[\_\_tests\_\_/firestore](./__tests__/firestore)

```sh
npm run test:firestore
```

Firestoreエミュレータを単独で使用するテスト。  
主にSecurity Rule（firestore.rules)のテストです。


## Cloud Functions 
[\_\_tests\_\_/functions](./__tests__/functions)

```sh
npm run test:functions
```

Cloud Functions + Firestore, PubSub の複数のエミュレータを協調させたテスト。  
Firestoreトリガー、PubSubトリガーでFunctionsが実行されたあとの状態をテストする。

# CI
[CircleCIの設定](./.circleci/config.yml)参照

# サンプルとしての題材
このリポジトリの本題はテストコードですが、テストするための題材である実装側の説明です。

## 要件
架空のレストランのレビューサイト

- レストランの情報は運営（admin）だけが編集可能
- ユーザーはレストランにレビュー文と、1-5の評価を付けることができる
- レストランには過去のレビュー評価の平均点が表示される
- 平均点によるランキング機能がある
- ランキングは1日1回更新

## Firestore設計
- /restaurants/{restaurantId}
    - （レストラン情報はユーザーからはread only）
    - rateAvg: number（レビュー平均点数）
    - rateNum: number（レビュー数）
    - name: string（レストラン名）
- /reviews/{userId}
    - （ログイン済みユーザーのみread/write可能、店舗ごとに一人のユーザーがレビュー投稿できるのは1回のみ）
    - rate: number（レビュー点数）
    - text: string（レビュー本文）
    - timestamp: timestamp（投稿時間）
    - userId: string（ユーザーid）
- /rankings/{id}
    - （ランキングはユーザーからはread only）
    - rank: number（順位）
    - rateAvg: number（レビュー平均点数）
    - restaurantId: string（レストランid）
    - restaurantName: string（レストラン名）

### Functions設計

以下の要件は、ユーザーからのwriteで自由に書き換えられてしまうとダメなのでSecurity Ruleでガードしつつ、Cloud FunctionsからAdmin SDKを使ってFirestoreを更新します。

- レストランには過去のレビュー評価の平均点が表示される
    - ユーザーがレビューを投稿したときのFirestoreトリガーで平均点を計算し直す
- ランキングは1日1回更新
    - Cloud SchedulerからPubSubを発火させ、PubSubトリガーでランキングを再集計する

# LICENSE
MIT