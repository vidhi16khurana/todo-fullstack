import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Mongo connection ---
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Todo model ---
const todoSchema = new mongoose.Schema(
  { title: { type: String, required: true, trim: true }, completed: { type: Boolean, default: false } },
  { timestamps: true }
);
const Todo = mongoose.model('Todo', todoSchema);

// --- Routes ---
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/todos', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status === 'active') where.completed = false;
    if (status === 'completed') where.completed = true;
    const todos = await Todo.find(where).sort({ createdAt: -1 });
    res.json(todos);
  } catch {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const todo = await Todo.create({ title: title.trim() });
    res.status(201).json(todo);
  } catch {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    const updates = {};
    if (typeof title === 'string') {
      if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty' });
      updates.title = title.trim();
    }
    if (typeof completed === 'boolean') updates.completed = completed;
    const todo = await Todo.findByIdAndUpdate(id, updates, { new: true });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Todo.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Todo not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.delete('/api/todos', async (_req, res) => {
  try {
    const result = await Todo.deleteMany({ completed: true });
    res.json({ deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ error: 'Failed to clear completed' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
