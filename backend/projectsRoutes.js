const express = require('express');
const db = require('./db');

const router = express.Router();

// GET /api/projects     
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT id, user_id, title, thumbnail_url, created_at
       FROM projects
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching projects:', err);
          return res.status(500).json({ message: 'Failed to fetch projects' });
        }
        res.json(rows || []);
      }
    );
  } catch (err) {
    console.error('Unexpected error in GET /projects:', err);
    res.status(500).json({ message: 'Unexpected error' });
  }
});

// GET /api/projects/:id    
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    db.get(
      `SELECT id, user_id, title, thumbnail_url, created_at
       FROM projects
       WHERE id = ? AND user_id = ?`,
      [id, userId],
      (err, row) => {
        if (err) {
          console.error('Error fetching project:', err);
          return res.status(500).json({ message: 'Failed to fetch project' });
        }
        if (!row) {
          return res.status(404).json({ message: 'Project not found' });
        }
        res.json(row);
      }
    );
  } catch (err) {
    console.error('Unexpected error in GET /projects/:id:', err);
    res.status(500).json({ message: 'Unexpected error' });
  }
});

// POST /api/projects
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { title, thumbnailUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const sql = `
      INSERT INTO projects (user_id, title, thumbnail_url)
      VALUES (?, ?, ?)
    `;
    const params = [userId, title, thumbnailUrl || null];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error inserting project:', err);
        return res.status(500).json({ message: 'Failed to create project' });
      }

      const newProject = {
        id: this.lastID,
        user_id: userId,
        title,
        thumbnail_url: thumbnailUrl || null,
        created_at: new Date().toISOString(),
      };

      res.status(201).json(newProject);
    });
  } catch (err) {
    console.error('Unexpected error in POST /projects:', err);
    res.status(500).json({ message: 'Unexpected error' });
  }
});

//  PUT /api/projects/:id
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, thumbnailUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let sql;
    let params;
    
    if (thumbnailUrl === undefined) {
      sql = `UPDATE projects SET title = ? WHERE id = ? AND user_id = ?`;
      params = [title, id, userId];
    } else {
      sql = `UPDATE projects SET title = ?, thumbnail_url = ? WHERE id = ? AND user_id = ?`;
      params = [title, thumbnailUrl, id, userId];
    }

    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error updating project:', err);
        return res.status(500).json({ message: "Error updating project" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: "Project not found or unauthorized" });
      }

      res.json({ message: "Project updated", changes: this.changes });
    });
  } catch (err) {
    console.error('Unexpected error in PUT /projects:', err);
    res.status(500).json({ message: 'Unexpected error' });
  }
});


// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sql = `DELETE FROM projects WHERE id = ? AND user_id = ?`;
    
    db.run(sql, [id, userId], function(err) {
      if (err) {
        console.error('Error deleting project:', err);
        return res.status(500).json({ message: "Error deleting project" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Project not found or unauthorized" });
      }

      res.json({ message: "Project deleted", changes: this.changes });
    });
  } catch (err) {
    console.error('Unexpected error in DELETE /projects:', err);
    res.status(500).json({ message: 'Unexpected error' });
  }
});

module.exports = router;