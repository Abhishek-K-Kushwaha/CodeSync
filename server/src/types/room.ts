export interface User {
  socketId: string;
  username: string;
}

export interface Room {
  roomId: string;
  passcode: string;
  users: User[];
  code: string;
}