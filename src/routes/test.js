// src/routes/test.js

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create test user
router.get('/create-user', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        stravaId: Math.random().toString(), // avoid unique conflict
        name: "Test Cyclist",
        accessToken: "dummy",
        refreshToken: "dummy",
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;