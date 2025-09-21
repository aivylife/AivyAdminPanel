export type User = {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  email: string | null
  name: string | null
  sex: string | null
  age: number | null
  isConfirmed: boolean
  isOnboarded: boolean
  isSubscribed: boolean
  isInstructionShowed: boolean
  photo: string | null
  appLang: string
  savePersonalInfo: boolean
  isAdmin: boolean
  answers:
    | {
        question: string
        answers: string[]
      }[]
    | object
  provider: string | null
  providerId: string | null
  isSurveyed: boolean
  isTrialUsed: boolean
  chatId: number | null
  trialStart: string | null
  deviceToken: string | null
  roleCode: string
  timezone: string
  updatedBy: { id: number }
  isEmailConfirmed: false
  isSecondarySurveyed: false
  subscription: {
    id: number
    startDate: string
    endDate: string
    planId: number
    isCreatedSchedule: boolean
    userId: number
    plan: Subscription
    currentMonthlyChatLimit: number
    currentMonthlyMarathonAccessLimit: number
  } | null
}

export type Subscription = {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  description: string
  type: 'standart_1m' | 'standart_3m' | 'standart_6m' | 'standart_12m'
  durationDays: number
  chatLimit: number
  scheduleDays: number
  isActive: boolean
  isFreeMarathons: boolean
  isFreeExercises: boolean
  price: number
  marathonAccessLimit: number
  monthlyChatLimit: number
  monthlyMarathonAccessLimit: number
}
