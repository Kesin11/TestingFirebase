import { firestore as admin_firestore } from "firebase-admin"
import { firestore } from "firebase";
// （認証ユーザーのみ、自分のレビューは店毎に1つだけ、timestampはサーバー時間、rateは1-5のint）
export type Review = {
  rate: number
  text: string
  updatedAt: firestore.Timestamp
  userId: string
}
export type ReviewInput = Omit<Review, 'updatedAt'>

export class ReviewAdminModel {
  constructor(private firestore: admin_firestore.Firestore) {}
  collectionRef (restaurantId: string) {
    return this.firestore.collection(`/restaurants/${restaurantId}/reviews`)
  }

  async set (restaurantId: string, review: ReviewInput) {
    const userId = review.userId
    return this.collectionRef(restaurantId).doc(userId).set({
      ...review,
      updatedAt: firestore.FieldValue.serverTimestamp()
    })
  }
}

export class ReviewUserModel {
  constructor(private firestore: firestore.Firestore) {}

  collectionRef (restaurantId: string) {
    return this.firestore.collection(`/restaurants/${restaurantId}/reviews`)
  }

  async get (restaurantId: string, userId: string) {
    return this.collectionRef(restaurantId).doc(userId).get()
  }

  async getAll (restaurantId: string) {
    return this.collectionRef(restaurantId).get()
  }

  async set (restaurantId: string, review: ReviewInput) {
    const userId = review.userId
    return this.collectionRef(restaurantId).doc(userId).set({
      ...review,
      updatedAt: firestore.FieldValue.serverTimestamp()
    })
  }
}
