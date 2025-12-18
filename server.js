const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbHelpers } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// ===== ALBUM ENDPOINTS =====

// Get all albums
app.get('/api/albums', async (req, res) => {
    try {
        const albums = await dbHelpers.getAllAlbums();
        res.json(albums);
    } catch (error) {
        console.error('Error fetching albums:', error);
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
});

// Get single album
app.get('/api/albums/:id', async (req, res) => {
    try {
        const album = await dbHelpers.getAlbum(req.params.id);
        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }
        res.json(album);
    } catch (error) {
        console.error('Error fetching album:', error);
        res.status(500).json({ error: 'Failed to fetch album' });
    }
});

// Create new album
app.post('/api/albums', upload.array('images', 50), async (req, res) => {
    try {
        const { name, category } = req.body;
        
        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }
        
        const albumId = await dbHelpers.createAlbum(name, category);
        
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const url = `/uploads/${file.filename}`;
                await dbHelpers.addImageToAlbum(albumId, url, '', i);
            }
        }
        
        const album = await dbHelpers.getAlbum(albumId);
        res.status(201).json(album);
    } catch (error) {
        console.error('Error creating album:', error);
        res.status(500).json({ error: 'Failed to create album' });
    }
});

// Update album
app.put('/api/albums/:id', upload.array('images', 50), async (req, res) => {
    try {
        const { name, category } = req.body;
        const albumId = req.params.id;
        
        await dbHelpers.updateAlbum(albumId, name, category);
        
        if (req.files && req.files.length > 0) {
            const existingImages = await dbHelpers.getAlbumImages(albumId);
            const startIndex = existingImages.length;
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const url = `/uploads/${file.filename}`;
                await dbHelpers.addImageToAlbum(albumId, url, '', startIndex + i);
            }
        }
        
        const album = await dbHelpers.getAlbum(albumId);
        res.json(album);
    } catch (error) {
        console.error('Error updating album:', error);
        res.status(500).json({ error: 'Failed to update album' });
    }
});

// Delete album
app.delete('/api/albums/:id', async (req, res) => {
    try {
        const albumId = req.params.id;
        const images = await dbHelpers.getAlbumImages(albumId);
        
        // Delete image files
        images.forEach(image => {
            const filepath = path.join(__dirname, image.url);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        });
        
        await dbHelpers.deleteAlbum(albumId);
        res.json({ message: 'Album deleted successfully' });
    } catch (error) {
        console.error('Error deleting album:', error);
        res.status(500).json({ error: 'Failed to delete album' });
    }
});

// ===== INQUIRY ENDPOINTS =====

// Get all inquiries
app.get('/api/inquiries', async (req, res) => {
    try {
        const inquiries = await dbHelpers.getAllInquiries();
        res.json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// Create new inquiry
app.post('/api/inquiries', async (req, res) => {
    try {
        const { name, email, phone, type, service, message, timestamp } = req.body;
        
        if (!name || !email || !type || !service || !message) {
            return res.status(400).json({ 
                error: 'Name, email, type, service, and message are required' 
            });
        }
        
        const inquiryId = await dbHelpers.createInquiry({
            name,
            email,
            phone: phone || '',
            type,
            service,
            message,
            timestamp: timestamp || new Date().toISOString()
        });
        
        res.status(201).json({ id: inquiryId, message: 'Inquiry submitted successfully' });
    } catch (error) {
        console.error('Error creating inquiry:', error);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
});

// Mark inquiry as read
app.patch('/api/inquiries/:id/read', async (req, res) => {
    try {
        await dbHelpers.markInquiryRead(req.params.id);
        res.json({ message: 'Inquiry marked as read' });
    } catch (error) {
        console.error('Error marking inquiry as read:', error);
        res.status(500).json({ error: 'Failed to mark inquiry as read' });
    }
});

// Delete inquiry
app.delete('/api/inquiries/:id', async (req, res) => {
    try {
        await dbHelpers.deleteInquiry(req.params.id);
        res.json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        res.status(500).json({ error: 'Failed to delete inquiry' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
