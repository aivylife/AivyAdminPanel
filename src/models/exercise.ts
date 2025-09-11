// export type ExerciseType = 'video' | 'affirmation' | 'audio' | 'exercise'; // Комментируем или удаляем старое определение

export interface ExerciseType {
  id: number;
  name: string;
  code: string;
}

export interface ExerciseMaterials {
  video?: number | null;
  cover?: number | null;
  text?: string;
  audio?: number | null;
  preview?: number | null;
  file?: number | null;
}

export interface File {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  uuidName: string;
  path: string;
  createdById: number;
}

export interface Exercise {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  title: string;
  description: string;
  timeCount: number;
  mainPhotoId: number | null;
  mainVideoId: number | null;
  typeId: number;
  isMarathon: boolean;
  isShared: boolean;
  contentId: number;
  type: ExerciseType;
  mainPhoto: File | null;
  mainVideo: File | null;
}

export interface CreateExerciseRequest {
  title: string;
  description: string;
  typeId: number;
  timeCount: number;
  mainPhotoId?: number;
  mainVideoId?: number;
  isMarathon?: boolean;
  isShared?: boolean;
  // Добавьте contentId или другие необходимые поля
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> {}

export interface ExerciseResponse {
  data: Exercise[];
  pagination: {
    totalElements: number;
    perPage: number;
    page: number;
  };
} 