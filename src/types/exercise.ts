export interface ExerciseType {
  id: number;
  name: string;
}

export interface File {
  id: number;
  path: string;
}

export interface AudioContent {
  title: string;
  description: string;
  timeCount: number;
  file: File;
}

export interface VideoContent {
  description: string;
  file: File;
}

export interface AffirmationContent {
  text: string;
}

export interface TaskContent {
  do: string;
  result: string;
}

export interface ExerciseContent {
  data: {
    description: string[];
    attachments: Array<{
      title: string;
      file: File | null;
    }>;
    AUDIO?: {
      description: string;
      content: AudioContent[];
    };
    VIDEO?: {
      description: string;
      file: File | null;
    };
    AFFIRMATION?: {
      description: string;
      content: AffirmationContent[];
    };
    TASK?: {
      description: string;
      content: TaskContent[];
    };
  };
}

export interface Exercise {
  id: number;
  title: string;
  description: string;
  timeCount: number;
  mainPhotoId: number;
  mainVideoId: number;
  mainPhoto: File | null;
  mainVideo: File | null;
  typeId: number;
  categoryId: number;
  formatId: number;
  filters: Array<{ id: number }>;
  icon: { id: number; name: string; path: string } | null;
  content: ExerciseContent;
} 