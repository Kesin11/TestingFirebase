import { firestore as admin_firestore } from "firebase-admin"
import { firestore } from "firebase";
// （認証ユーザーのみ、自分のレビューは店毎に1つだけ、timestampはサーバー時間、ratingは0-5のint）
export type Rating = {
  rating: number
  text: string
  updatedAt: firestore.Timestamp
  userId: string
}
export type RatingInput = Omit<Rating, 'updatedAt'>

export class RatingAdminModel {
  constructor(private firestore: admin_firestore.Firestore) {}
  collectionRef (restaurantId: string) {
    return this.firestore.collection(`/restaurants/${restaurantId}/ratings`)
  }

  async set (restaurantId: string, rating: RatingInput) {
    const userId = rating.userId
    return this.collectionRef(restaurantId).doc(userId).set({
      ...rating,
      updatedAt: firestore.FieldValue.serverTimestamp()
    })
  }
}

export class RatingUserModel {
  constructor(private firestore: firestore.Firestore) {}

  collectionRef (restaurantId: string) {
    return this.firestore.collection(`/restaurants/${restaurantId}/ratings`)
  }

  async get (restaurantId: string, userId: string) {
    return this.collectionRef(restaurantId).doc(userId).get()
  }

  async getAll (restaurantId: string) {
    return this.collectionRef(restaurantId).get()
  }

  async set (restaurantId: string, rating: RatingInput) {
    const userId = rating.userId
    return this.collectionRef(restaurantId).doc(userId).set({
      ...rating,
      updatedAt: firestore.FieldValue.serverTimestamp()
    })
  }
}
