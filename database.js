const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database schema
function initializeDatabase() {
    db.serialize(() => {
        // Albums table
        db.run(`
            CREATE TABLE IF NOT EXISTS albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Images table
        db.run(`
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                album_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                caption TEXT,
                order_index INTEGER DEFAULT 0,
                FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
            )
        `);
        
        // Inquiries table
        db.run(`
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                type TEXT NOT NULL,
                service TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });
}

// Database helper functions
const dbHelpers = {
    // Album operations
    getAllAlbums: () => {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    a.id, 
                    a.name, 
                    a.category, 
                    a.created_at,
                    GROUP_CONCAT(
                        json_object(
                            'id', i.id,
                            'url', i.url,
                            'caption', i.caption,
                            'order_index', i.order_index
                        )
                    ) as images_json
                FROM albums a
                LEFT JOIN images i ON a.id = i.album_id
                GROUP BY a.id
                ORDER BY a.created_at DESC
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    const albums = rows.map(row => ({
                        id: row.id,
                        name: row.name,
                        category: row.category,
                        created_at: row.created_at,
                        images: row.images_json 
                            ? JSON.parse('[' + row.images_json + ']').sort((a, b) => a.order_index - b.order_index)
                            : []
                    }));
                    resolve(albums);
                }
            });
        });
    },
    
    getAlbum: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM albums WHERE id = ?', [id], (err, album) => {
                if (err) reject(err);
                else if (!album) resolve(null);
                else {
                    db.all('SELECT * FROM images WHERE album_id = ? ORDER BY order_index', [id], (err, images) => {
                        if (err) reject(err);
                        else resolve({ ...album, images: images || [] });
                    });
                }
            });
        });
    },
    
    createAlbum: (name, category) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO albums (name, category) VALUES (?, ?)',
                [name, category],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },
    
    updateAlbum: (id, name, category) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE albums SET name = ?, category = ? WHERE id = ?',
                [name, category, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },
    
    deleteAlbum: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM albums WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    
    // Image operations
    addImageToAlbum: (albumId, url, caption, orderIndex) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO images (album_id, url, caption, order_index) VALUES (?, ?, ?, ?)',
                [albumId, url, caption, orderIndex],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },
    
    getAlbumImages: (albumId) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM images WHERE album_id = ? ORDER BY order_index',
                [albumId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    },
    
    // Inquiry operations
    getAllInquiries: () => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM inquiries ORDER BY created_at DESC',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    },
    
    createInquiry: (data) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO inquiries (name, email, phone, type, service, message, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [data.name, data.email, data.phone, data.type, data.service, data.message, data.timestamp],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },
    
    markInquiryRead: (id) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE inquiries SET read = 1 WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },
    
    deleteInquiry: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM inquiries WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

module.exports = { db, dbHelpers };
