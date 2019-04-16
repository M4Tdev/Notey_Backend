const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const shortid = require('shortid');

const adapter = new FileAsync('db.json');

const app = express();

const PORT = process.env.PORT || 3030;

// Middleware
app.use(bodyParser.json());
// app.use(cors);

// Echo/test route
app.get('/echo', (req, res) => {
  res.json({ msg: 'API works' });
});

low(adapter)
  .then(db => {
    // Routes

    // GET users notes
    app.get('/api/:userId/notes', async (req, res) => {
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
    });

    // POST new note
    app.post('/api/:userId/notes', async (req, res) => {
      const { userId } = req.params;

      const note = { id: shortid.generate(), ...req.body };

      await db
        .get('users')
        .get(userId)
        .push(note)
        .write();

      res.status(201).send(note);
    });

    // Set db default values
    return db.defaults({ users: {} }).write();
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));
  });
