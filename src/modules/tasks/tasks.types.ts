export interface Task {
  id: string;
  userId: number;
  text: string;
  isDone: boolean;
  createdAt: Date;
}
