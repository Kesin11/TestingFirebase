import uuid from 'uuid/v4'

export const generateRandomUserConfig = () => {
  return {
    email: `${uuid()}@example.com`,
    password: Math.round(Math.random()*100000000).toString()
  }
}

export const dummyUsers = () => {
  return [
    {"email": "test1@example.com", "password": "testtest"},
    {"email": "test2@example.com", "password": "testtest"},
  ]
}