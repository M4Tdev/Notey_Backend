const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongodb = require('mongodb');
const dotenv = require('dotenv').config();

const shortid = require('shortid');

const app = express();

const PORT = process.env.PORT || 3030;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

// env variables
const dbUser = process.env.DB_USER;
const dbPasswd = process.env.DB_PASSWD;

// MongoDB function
const loadNotesCollection = async () => {
  const client = await mongodb.MongoClient.connect(
    `mongodb+srv://${dbUser}:${dbPasswd}@cluster0-jmzjv.mongodb.net/test?retryWrites=true`,
    {
      useNewUrlParser: true,
    }
  );

  return client.db('NoteyDB').collection('users'); // top change to new production collection "notes"
};

// Routes

const auth = 'noteyapp';

app.get('/echo', async (req, res) => {
  res.json({ Status: 'API is working fine' });
});

// GET users notes
app.get('/api/:userId/notes', async (req, res) => {
  if (req.headers.authorization === auth) {
    try {
      const { userId } = req.params;

      const notes = await loadNotesCollection();

      const user = await notes.find({ userId }).toArray();

      res.status(200).send(user);
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(401).json({ error: 'You are not authorized!' });
  }
});

// POST new note
app.post('/api/:userId/notes', async (req, res) => {
  if (req.headers.authorization === auth) {
    try {
      const { userId } = req.params;

      const note = { id: shortid.generate(), userId, ...req.body };

      const notes = await loadNotesCollection();

      await notes.insertOne({ ...note });

      res.status(201).send(note);
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(401).json({ error: 'You are not authorized!' });
  }
});

// GET note by id
app.get('/api/:userId/notes/:noteId', async (req, res) => {
  if (req.headers.authorization === auth) {
    try {
      const { userId, noteId } = req.params;

      const notes = await loadNotesCollection();

      const note = await notes.find({ userId, id: noteId }).toArray();

      res.status(200).send(note);
    } catch (err) {
      console.error(err);
    }
  } else {
    res.status(401).json({ error: 'You are not authorized' });
  }
});

// PATCH note by id
app.patch('/api/:userId/notes/:noteId', async (req, res) => {
  if (req.headers.authorization === auth) {
    try {
      const { userId, noteId } = req.params;

      const notes = await loadNotesCollection();
      await notes.updateOne({ userId, id: noteId }, { $set: { ...req.body } });

      const updatedNote = await notes.find({ userId, id: noteId }).toArray();

      res.status(200).send(updatedNote);
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(401).json({ error: 'You are not authorized' });
  }
});

// DELETE note by id
app.delete('/api/:userId/notes/:noteId', async (req, res) => {
  if (req.headers.authorization === auth) {
    try {
      const { userId, noteId } = req.params;

      const notes = await loadNotesCollection();
      await notes.remove({ userId, id: noteId }, true);

      res.status(200).json({});
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(401).json({ error: 'You are not authorized' });
  }
});

app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));
