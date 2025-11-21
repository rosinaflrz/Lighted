const express = require('express');
const db = require('./db');
const { uploadImageToS3 } = require('./s3Service');

const router = express.Router();

// GET /api/projects
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching projects', err);
          return res.status(500).json({ message: 'Error fetching projects' });
        }
        res.json(rows || []);
      }
    );
  } catch (err) {
    console.error('Server error (GET /projects):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;

    db.get(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, userId],
      (err, row) => {
        if (err) {
          console.error('Error fetching project', err);
          return res.status(500).json({ message: 'Error fetching project' });
        }
        if (!row) return res.status(404).json({ message: 'Not found' });
        res.json(row);
      }
    );
  } catch (err) {
    console.error('Server error (GET /projects/:id):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    let { title, thumbnailUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Si viene base64, subir a S3
    if (thumbnailUrl && thumbnailUrl.startsWith('data:image')) {
      try {
        thumbnailUrl = await uploadImageToS3(thumbnailUrl);
      } catch (e) {
        console.error('Error uploading image to S3:', e);
        return res.status(500).json({ message: 'Error uploading image' });
      }
    }

    const sql =
      'INSERT INTO projects (user_id, title, thumbnail_url) VALUES (?, ?, ?)';

    db.run(sql, [userId, title, thumbnailUrl || null], function (err) {
      if (err) {
        console.error('Failed to create project', err);
        return res.status(500).json({ message: 'Failed to create project' });
      }

      const newProject = {
        id: this.lastID,
        user_id: userId,
        title,
        thumbnail_url: thumbnailUrl,
        created_at: new Date(),
      };

      if (req.io) {
        req.io.emit('projects_updated', {
          action: 'create',
          projectId: this.lastID,
        });
      }

      res.status(201).json(newProject);
    });
  } catch (err) {
    console.error('Server error (POST /projects):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    let { title, thumbnailUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title required' });
    }

    if (thumbnailUrl && thumbnailUrl.startsWith('data:image')) {
      try {
        thumbnailUrl = await uploadImageToS3(thumbnailUrl);
      } catch (e) {
        console.error('Error uploading image to S3:', e);
        return res.status(500).json({ message: 'Error uploading image' });
      }
    }

    let sql;
    let params;

    if (thumbnailUrl === undefined) {
      sql = 'UPDATE projects SET title = ? WHERE id = ? AND user_id = ?';
      params = [title, id, userId];
    } else {
      sql =
        'UPDATE projects SET title = ?, thumbnail_url = ? WHERE id = ? AND user_id = ?';
      params = [title, thumbnailUrl, id, userId];
    }

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error updating project', err);
        return res.status(500).json({ message: 'Error updating' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Not found' });
      }

      if (req.io) {
        req.io.emit('projects_updated', {
          action: 'update',
          projectId: id,
        });
      }

      res.json({ message: 'Updated', changes: this.changes });
    });
  } catch (err) {
    console.error('Server error (PUT /projects/:id):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  db.run(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [req.params.id, userId],
    function (err) {
      if (err) {
        console.error('Error deleting project', err);
        return res.status(500).json({ message: 'Error deleting' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Not found' });
      }

      if (req.io) {
        req.io.emit('projects_updated', {
          action: 'delete',
          projectId: req.params.id,
        });
      }

      res.json({ message: 'Deleted' });
    }
  );
});

module.exports = router;
