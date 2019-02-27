import uuid from 'uuid/v4'

export const generateRandomUserConfig = () => {
  return {
    email: `${uuid()}@example.com`,
    password: Math.round(Math.random()*100000000).toString()
  }
}