const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Define the persistent disk path (Render.com)
const RENDER_DISK_PATH = '/app/disk';

// Determine database path
let dbPath;
if (fs.existsSync(RENDER_DISK_PATH)) {
    console.log('Using persistent disk for database');
    dbPath = path.join(RENDER_DISK_PATH, 'database.db');
} else {
    console.log('Using local storage for database');
    dbPath = path.join(__dirname, 'database.db');
}

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log(`Connected to SQLite database at ${dbPath}`);
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

        // Customers table
        db.run(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bookings table
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                details TEXT,
                amount REAL,
                booking_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Add new columns to albums table if they don't exist
        const addColumn = (table, column, type) => {
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
                // Ignore error if column already exists
            });
        };

        addColumn('albums', 'is_private', 'INTEGER DEFAULT 0');
        addColumn('albums', 'passphrase', 'TEXT');
        addColumn('albums', 'access_token', 'TEXT');
        addColumn('albums', 'customer_id', 'INTEGER');
        
        addColumn('images', 'client_feedback', 'TEXT');
        addColumn('images', 'is_selected', 'INTEGER DEFAULT 0');
    });
}

// Database helper functions
const dbHelpers = {
    // Customer operations
    getAllCustomers: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    createCustomer: (data) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO customers (name, email, phone, notes) VALUES (?, ?, ?, ?)',
                [data.name, data.email, data.phone, data.notes],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    updateCustomer: (id, data) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE customers SET name = ?, email = ?, phone = ?, notes = ? WHERE id = ?',
                [data.name, data.email, data.phone, data.notes, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    deleteCustomer: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM customers WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // Booking operations
    getCustomerBookings: (customerId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM bookings WHERE customer_id = ? ORDER BY booking_date DESC', [customerId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    createBooking: (data) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO bookings (customer_id, details, amount, booking_date) VALUES (?, ?, ?, ?)',
                [data.customer_id, data.details, data.amount, data.booking_date],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    // Album operations
    getAllAlbums: () => {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    a.id, 
                    a.name, 
                    a.category, 
                    a.created_at,
                    a.is_private,
                    a.passphrase,
                    a.access_token,
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
                        is_private: row.is_private,
                        passphrase: row.passphrase,
                        access_token: row.access_token,
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

    getAlbumByToken: (token) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM albums WHERE access_token = ?', [token], (err, album) => {
                if (err) reject(err);
                else if (!album) resolve(null);
                else {
                    // Don't return images yet, wait for passphrase verification
                    resolve(album);
                }
            });
        });
    },
    
    createAlbum: (data) => {
        return new Promise((resolve, reject) => {
            // Handle both old signature (name, category) and new object signature
            const name = typeof data === 'object' ? data.name : arguments[0];
            const category = typeof data === 'object' ? data.category : arguments[1];
            const is_private = (typeof data === 'object' && data.is_private) ? 1 : 0;
            const passphrase = (typeof data === 'object' && data.passphrase) ? data.passphrase : null;
            const customer_id = (typeof data === 'object' && data.customer_id) ? data.customer_id : null;
            
            // Generate random token if private
            const access_token = is_private ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;

            db.run(
                'INSERT INTO albums (name, category, is_private, passphrase, access_token, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
                [name, category, is_private, passphrase, access_token, customer_id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },
    
    updateAlbum: (id, data) => {
        return new Promise((resolve, reject) => {
            // Handle both old signature (id, name, category) and new object signature
            const name = typeof data === 'object' ? data.name : arguments[1];
            const category = typeof data === 'object' ? data.category : arguments[2];
            
            // If it's the old signature, we just update name and category
            if (typeof data !== 'object') {
                db.run(
                    'UPDATE albums SET name = ?, category = ? WHERE id = ?',
                    [name, category, id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
                return;
            }

            // New signature with full data
            db.run(
                'UPDATE albums SET name = ?, category = ?, is_private = ?, passphrase = ?, customer_id = ? WHERE id = ?',
                [name, category, data.is_private ? 1 : 0, data.passphrase, data.customer_id, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    updateImageFeedback: (id, feedback, isSelected) => {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE images SET client_feedback = ?, is_selected = ? WHERE id = ?',
                [feedback, isSelected ? 1 : 0, id],
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
