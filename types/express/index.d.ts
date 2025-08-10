
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {}; // Required to make this a module
