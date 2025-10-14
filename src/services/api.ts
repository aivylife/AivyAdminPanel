import { api } from '../boot/axios'
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
} from 'src/models/auth'
import {
  Exercise,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  ExerciseResponse,
} from 'src/models/exercise'

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', data),
  me: () => api.get<MeResponse>('/auth/me'),
}

export const exerciseApi = {
  getAll: (params: Record<string, any>) => {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value.toString())
      }
    })

    return api.get<ExerciseResponse>(`/exercise?${queryParams.toString()}`)
  },
  getById: (id: number) => api.get<Exercise>(`/exercise/${id}`),
  create: (data: CreateExerciseRequest) =>
    api.post<Exercise>('/exercise', data),
  update: (id: number, data: UpdateExerciseRequest) =>
    api.patch<Exercise>(`/exercise/${id}`, data),
  delete: (id: number) => api.delete(`/exercise/${id}`),
}

export const moduleApi = {
  getAll: (page = 1, limit = 10) =>
    api.get('/module', { params: { page, limit } }),
  getById: (id: number) => api.get(`/module/${id}`),
  create: (data: any) => api.post('/module', data),
  update: (id: number, data: any) => api.patch(`/module/${id}`, data),
  delete: (id: number) => api.delete(`/module/${id}`),
}

export const marathonApi = {
  getAll: (page = 1, limit = 10) =>
    api.get('/marathon', { params: { page, limit } }),
  getById: (id: number) => api.get(`/marathon/${id}`),
  create: (data: any) => api.post('/marathon', data),
  update: (id: number, data: any) => api.patch(`/marathon/${id}`, data),
  delete: (id: number) => api.delete(`/marathon/${id}`),
}

export const marathonCategoryApi = {
  getAll: (page = 1, limit = 10) =>
    api.get('/marathon-category', { params: { page, limit } }),
  getById: (id: number) => api.get(`/marathon-category/${id}`),
  create: (data: any) => api.post('/marathon-category', data),
  update: (id: number, data: any) =>
    api.patch(`/marathon-category/${id}`, data),
  delete: (id: number) => api.delete(`/marathon-category/${id}`),
}
