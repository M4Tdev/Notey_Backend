const express = require('express');

const app = express();

app.get('/api', (req, res) => {
  res.json({ msg: 'API works' });
});

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => console.log(`Server is listening on port: ${PORT}`));
