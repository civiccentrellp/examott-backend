// types/AuthedRequest.ts
import express from 'express';

export type AuthedRequest = express.Request & {
  user: {
    id: string;
    role: string;
    name?: string;
    email?: string;
  };
};
