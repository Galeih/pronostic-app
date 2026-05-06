// Enums

export type PredictionStatus =
  | 'Draft'
  | 'Open'
  | 'VoteClosed'
  | 'AwaitingResolution'
  | 'Resolved'
  | 'Archived'
  | 'Cancelled'

export type ResolutionMode = 'CreatorDecision' | 'GroupValidation' | 'Automatic'

export type PredictionVisibility = 'PrivateLink' | 'GroupOnly' | 'Public'

export type BoostType =
  | 'VoteCorrection'
  | 'SecondVote'
  | 'RewardMultiplier'
  | 'Sabotage'
  | 'Shield'
  | 'Information'
  | 'Cosmetic'

export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Secret'

export type GroupRole = 'Owner' | 'Admin' | 'Member' | 'Guest'

// Utilisateur

export interface User {
  id: string
  userName: string
  email: string
  avatarUrl?: string
  level: number
  experience: number
  totalPoints: number
  isGuest: boolean
  createdAt: string
}

// Pronostic

export interface PredictionOption {
  id: string
  label: string
  description?: string
  imageUrl?: string
  sortOrder: number
  voteCount?: number
  votePercentage?: number
}

export interface MyVote {
  voteId: string
  optionId: string
  secondOptionId?: string
  isCorrect?: boolean
  rewardPoints: number
  createdAt: string
}

export interface Prediction {
  id: string
  creatorId: string
  creatorName: string
  groupId?: string
  question: string
  context?: string
  imageUrl?: string
  status: PredictionStatus
  visibility: PredictionVisibility
  resolutionMode: ResolutionMode
  voteDeadline: string
  revealDate?: string
  correctOptionId?: string
  allowBoosts: boolean
  allowSabotage: boolean
  isAnonymous: boolean
  baseReward: number
  maxParticipants?: number
  shareCode: string
  shareUrl: string
  createdAt: string
  publishedAt?: string
  resolvedAt?: string
  options: PredictionOption[]
  participantCount?: number
  isCreator?: boolean
  myVote?: MyVote
}

// Vote

export interface Vote {
  id: string
  predictionId: string
  userId: string
  optionId: string
  secondOptionId?: string
  isCorrect?: boolean
  rewardPoints: number
  createdAt: string
}

// Boost

export interface Boost {
  id: string
  name: string
  description: string
  boostType: BoostType
  rarity: BadgeRarity
  effectValue: number
}

export interface UserBoost {
  id: string
  boost: Boost
  quantity: number
  acquiredAt: string
  expiresAt?: string
}

// Réponse du catalogue GET /api/boosts (inclut la quantité possédée)
export interface BoostCatalogItem {
  id: string
  name: string
  description: string
  boostType: BoostType
  rarity: BadgeRarity
  effectValue: number
  ownedQuantity: number
}

// Reponse de l'API POST /vote
export interface VoteApiResponse {
  voteId: string
  predictionId: string
  optionId: string
  optionLabel: string
  secondOptionId?: string
  secondOptionLabel?: string
  createdAt: string
  message: string
}

// Badge

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl?: string
  rarity: BadgeRarity
  isSecret: boolean
}

export interface UserBadge {
  id: string
  badge: Badge
  unlockedAt: string
  relatedPredictionId?: string
}

// Auth

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  userName: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

// API generique

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
