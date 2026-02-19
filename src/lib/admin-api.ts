import { apiRequest } from './admin-api-client'

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export type AdminUserFilters = Record<
  string,
  string | number | boolean | string[] | number[] | boolean[] | undefined
>

type AdminUser = {
  _id: string
  username: string
  realName?: string
  profilePicture?: string
  email?: string
  phoneNumber?: string
  gender?: string
  dob?: string
  work?: string
  institution?: string
  maritalStatus?: string
  religion?: string
  hometown?: string
  languages?: string[]
  isArchived?: boolean
  isActive?: boolean
  credits?: number
  createdAt?: string
  verificationStatus?: string
  isAdmin?: boolean
}

type Question = {
  _id: string
  leftOption: string
  rightOption: string
  leftImageUrl: string
  rightImageUrl: string
  submittedBy?: {
    username?: string
  }
}

type ReportedUserReport = {
  _id: string
  category: string
  reason?: string
  details?: string
  status: 'open' | 'reviewing' | 'closed'
  createdAt: string
  reporter?: {
    _id?: string
    username?: string
    realName?: string
    profilePicture?: string
    email?: string
  }
  reportedUser?: {
    _id?: string
    username?: string
    realName?: string
    profilePicture?: string
    email?: string
    isArchived?: boolean
    isActive?: boolean
  }
  roomId?: {
    _id?: string
  }
}

type CreditLedgerRow = {
  _id: string
  type: string
  amount: number
  balanceAfter: number
  createdAt: string
  user?: {
    _id?: string
    username?: string
  }
}

type DashboardStats = {
  totalUsers: number
  activeUsers: number
  matchingUsers: number
  archivedUsers: number
  pendingQuestions: number
  onlineNow?: number
  verifiedUsers?: number
  inactiveUsers?: number
  genderDistribution?: {
    male?: number
    female?: number
    other?: number
    unknown?: number
  }
  verificationBreakdown?: {
    not_started?: number
    pending?: number
    approved?: number
    rejected?: number
    failed?: number
  }
  ageDistribution?: {
    '<18'?: number
    '18-24'?: number
    '25-34'?: number
    '35-44'?: number
    '45-54'?: number
    '55+'?: number
  }
  locationAnalytics?: {
    mode?: 'global' | 'country'
    selectedCountry?: string | null
    level?: 'country' | 'state'
    distribution?: Array<{
      key: string
      label: string
      count: number
    }>
    availableCountries?: Array<{
      key: string
      label: string
      count: number
    }>
  }
  credit?: {
    transactions?: number
    totalAwarded?: number
    totalSpent?: number
  }
}

export type AdminOptionItem = {
  label: string
  value: string
}

export type AdminOptionsMap = Record<string, AdminOptionItem[]>

type AdminOptionsResponse = {
  key?: string
  options: AdminOptionsMap
  version?: string
  updatedAt?: string
  lastUpdatedBy?: string | null
}

export type AdminUserGroup = {
  _id: string
  name: string
  description?: string
  memberCount?: number
  members?: Array<{
    _id: string
    username?: string
    email?: string
  }>
  createdAt?: string
  updatedAt?: string
}

type AdminCampaignPayload = {
  channel: 'push' | 'email'
  targetType: 'all' | 'users' | 'groups'
  title?: string
  emailSubject?: string
  body: string
  userIds?: string[]
  usernames?: string[]
  groupIds?: string[]
}

export const loginAdminWithGoogle = async (code: string) => {
  return apiRequest<ApiResponse<{ accessToken: string; user: AdminUser }> & {
    accessToken?: string
    user?: AdminUser
  }>('/admin/auth/google-signin-web', 'POST', {
    code,
  })
}

export const getAdminStats = async (params?: {
  locationMode?: 'global' | 'country'
  country?: string
  locationLimit?: number
}) => {
  const q = new URLSearchParams()
  if (params?.locationMode) q.set('locationMode', params.locationMode)
  if (params?.country) q.set('country', params.country)
  if (params?.locationLimit) q.set('locationLimit', String(params.locationLimit))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiRequest<ApiResponse<DashboardStats>>(`/admin/stats${suffix}`)
}

export const getAdminUsers = async (params: {
  page?: number
  limit?: number
  search?: string
  filters?: AdminUserFilters
}) => {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, rawValue]) => {
      if (rawValue === undefined || rawValue === null || rawValue === '') return
      const value = Array.isArray(rawValue) ? rawValue.join(',') : String(rawValue)
      q.set(key, value)
    })
  }
  return apiRequest<ApiResponse<AdminUser[]>>(`/admin/users?${q.toString()}`)
}

export const updateUserArchive = async (userId: string, isArchived: boolean) => {
  return apiRequest<ApiResponse<AdminUser>>(
    `/admin/users/${userId}/archive`,
    'PATCH',
    { isArchived }
  )
}

export const getPendingQuestions = async (params: {
  page?: number
  limit?: number
}) => {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  return apiRequest<ApiResponse<Question[]>>(
    `/admin/games/this-or-that/pending?${q.toString()}`
  )
}

export const setQuestionStatus = async (
  questionId: string,
  status: 'approved' | 'rejected' | 'pending'
) => {
  return apiRequest<ApiResponse<Question>>(
    `/games/this-or-that/questions/${questionId}/status`,
    'PATCH',
    { status }
  )
}

export const getCreditLedger = async (params: {
  page?: number
  limit?: number
  userId?: string
  type?: string
}) => {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.userId) q.set('userId', params.userId)
  if (params.type) q.set('type', params.type)
  return apiRequest<ApiResponse<CreditLedgerRow[]>>(
    `/admin/credits/ledger?${q.toString()}`
  )
}

export const getReportedUsers = async (params: {
  page?: number
  limit?: number
  status?: 'open' | 'reviewing' | 'closed'
}) => {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.status) q.set('status', params.status)
  return apiRequest<ApiResponse<ReportedUserReport[]>>(
    `/admin/reported-users?${q.toString()}`
  )
}

export const updateReportedUserStatus = async (
  reportId: string,
  status: 'open' | 'reviewing' | 'closed'
) => {
  return apiRequest<ApiResponse<ReportedUserReport>>(
    `/admin/reported-users/${reportId}/status`,
    'PATCH',
    { status }
  )
}

export const getAdminOptions = async () => {
  return apiRequest<ApiResponse<AdminOptionsResponse>>('/admin/options')
}

export const patchAdminOptions = async (options: AdminOptionsMap) => {
  return apiRequest<ApiResponse<AdminOptionsResponse>>('/admin/options', 'PATCH', {
    options,
  })
}

export const getUserGroups = async () => {
  return apiRequest<ApiResponse<AdminUserGroup[]>>('/admin/user-groups')
}

export const createUserGroup = async (payload: {
  name: string
  description?: string
  userIds?: string[]
  usernames?: string[]
  filters?: AdminUserFilters
}) => {
  return apiRequest<ApiResponse<AdminUserGroup>>('/admin/user-groups', 'POST', payload)
}

export const updateUserGroupMembers = async (
  groupId: string,
  payload: {
    action: 'add' | 'remove' | 'set'
    userIds?: string[]
    usernames?: string[]
    filters?: AdminUserFilters
  }
) => {
  return apiRequest<ApiResponse<AdminUserGroup>>(
    `/admin/user-groups/${groupId}/members`,
    'PATCH',
    payload
  )
}

export const sendAdminCampaign = async (payload: AdminCampaignPayload) => {
  return apiRequest<ApiResponse<{ recipientCount?: number }>>(
    '/admin/notifications/send',
    'POST',
    payload
  )
}
