import type { Scene, Character, ConversationMessage } from './types'

const testScene: Scene = {
  environment: 'Coffee shop',
  characters: [],
  triggerEvent: 'Someone spills coffee',
  situation: 'User needs to react',
  hiddenTension: 'Character A is nervous',
  userGoal: 'Greet politely',
  firstLine: 'Hey, how are you?',
  dramaLevel: 3,
  closureCondition: 'Class starts',
}

console.log(testScene)
