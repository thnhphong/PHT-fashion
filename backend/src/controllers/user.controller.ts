import { Request, Response } from 'express';
import { createUser, findUserByEmail } from '../services/user.service';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = await createUser({ name, email, phone, address, password });
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}