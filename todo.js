const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = "zero";

mongoose.connect('mongodb+srv://umangaw2_db_user:ErhiBwXWN3KTkVAC@cluster0.77ikgws.mongodb.net/')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

const TaskSchema = new mongoose.Schema({
  username: String,
  description: String,
  completed: Boolean
});

const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "token required" });

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: "invalid token" });
  }
}

// signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: "user exists" });

  await User.create({ username, password });
  res.json({ message: "signed up" });
});

// signin
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) return res.status(403).json({ message: "invalid creds" });

  const token = jwt.sign({ username }, JWT_SECRET);
  res.json({ token });
});

// add task
app.post('/add-task', auth, async (req, res) => {
  const { description } = req.body;

  const task = await Task.create({
    username: req.user.username,
    description,
    completed: false
  });

  res.json(task);
});

// view tasks
app.get('/view-task', auth, async (req, res) => {
  const tasks = await Task.find({ username: req.user.username });
  res.json(tasks);
});

// complete task
app.patch('/complete-task/:id', auth, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, username: req.user.username },
    { completed: true },
    { new: true }
  );

  if (!task) return res.status(404).json({ message: "not found" });
  res.json(task);
});

// edit task
app.patch('/edit-task/:id', auth, async (req, res) => {
  const { description } = req.body;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, username: req.user.username },
    { description },
    { new: true }
  );

  if (!task) return res.status(404).json({ message: "not found" });
  res.json(task);
});

// delete task
app.delete('/delete-task/:id', auth, async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    username: req.user.username
  });

  if (!task) return res.status(404).json({ message: "not found" });
  res.json({ message: "deleted", task });
});


app.listen(3000, () => console.log("Server running on 3000"));
