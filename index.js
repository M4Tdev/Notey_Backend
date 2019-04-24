const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const helmet = require('helmet');

const shortid = require('shortid');

const adapter = new FileAsync('db.json');

const app = express();

const PORT = process.env.PORT || 3030;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

// Echo/test route
app.get('/echo', (req, res) => {
  res.json({ msg: 'API works' });
});

low(adapter)
  .then(db => {
    // Routes

    const auth = 'noteyapp';

    // GET users notes
    app.get('/api/:userId/notes', async (req, res) => {
      if (req.headers.authorization === auth) {
        try {
          const { userId } = req.params;
          const hasUser = await db
            .get('users')
            .has(userId)
            .value();

          // If user does not exist, create it
          if (!hasUser) {
            await db
              .get('users')
              .assign({ [userId]: [] })
              .write();
          }

          // Take users notes from db
          const user = await db
            .get('users')
            .get(userId)
            .value();

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

          const note = { id: shortid.generate(), ...req.body };

          await db
            .get('users')
            .get(userId)
            .push(note)
            .write();

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

          const note = await db
            .get('users')
            .get(userId)
            .find({ id: noteId })
            .value();

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

          const note = await db
            .get('users')
            .get(userId)
            .find({ id: noteId })
            .assign({ ...req.body })
            .write();

          res.status(200).send(note);
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

          const index = await db
            .get('users')
            .get(userId)
            .findIndex({ id: noteId })
            .value();

          await db
            .get('users')
            .get(userId)
            .splice(index, 1)
            .write();

          res.status(200).json({});
        } catch (err) {
          console.log(err);
        }
      } else {
        res.status(401).json({ error: 'You are not authorized' });
      }
    });

    // Set db default values
    return db.defaults({ users: {} }).write();
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));
  });
