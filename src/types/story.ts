import { File } from '@/models/exercise'

export type Actuals = {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  stories: Story[]
  preview: File | null
}

export type Story = {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  title: string
  description: string
  positionText: string
  group: string
  order: number
  fileId: number | null
  isReleased: true
  isBanner: boolean
  previewId: number | null
  link: string | null
  file: File | null
  preview: File | null
}
