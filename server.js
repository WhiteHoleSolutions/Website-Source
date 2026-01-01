const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbHelpers } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Define the persistent disk path (Render.com)
const RENDER_DISK_PATH = '/app/disk';

// Determine uploads directory
let uploadsDir;
if (fs.existsSync(RENDER_DISK_PATH)) {
    console.log('Using persistent disk for uploads');
    uploadsDir = path.join(RENDER_DISK_PATH, 'uploads');
} else {
    console.log('Using local storage for uploads');
    uploadsDir = path.join(__dirname, 'uploads');
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'));
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
        const { name, category, is_private, passphrase, customer_id } = req.body;
        
        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }
        
        const albumId = await dbHelpers.createAlbum({
            name, 
            category,
            is_private: is_private === 'true',
            passphrase,
            customer_id
        });
        
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
        const { name, category, is_private, passphrase, customer_id } = req.body;
        const albumId = req.params.id;
        
        await dbHelpers.updateAlbum(albumId, {
            name, 
            category,
            is_private: is_private === 'true',
            passphrase,
            customer_id
        });
        
        if (req.files && req.files.length > 0) {
            const existingImages = await dbHelpers.getAlbumImages(albumId);
            const startIndex = existingImages.length > 0 ? Math.max(...existingImages.map(i => i.order_index)) + 1 : 0;
            
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

// ===== CUSTOMER ENDPOINTS =====

app.get('/api/customers', async (req, res) => {
    try {
        const customers = await dbHelpers.getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const id = await dbHelpers.createCustomer(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        await dbHelpers.updateCustomer(req.params.id, req.body);
        res.json({ message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await dbHelpers.deleteCustomer(req.params.id);
        res.json({ message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

app.get('/api/customers/:id/bookings', async (req, res) => {
    try {
        const bookings = await dbHelpers.getCustomerBookings(req.params.id);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const id = await dbHelpers.createBooking(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// ===== PRIVATE ALBUM ENDPOINTS =====

app.post('/api/albums/token/:token', async (req, res) => {
    try {
        const { passphrase } = req.body;
        const album = await dbHelpers.getAlbumByToken(req.params.token);
        
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        if (album.passphrase === passphrase) {
            // Fetch images for the album
            const fullAlbum = await dbHelpers.getAlbum(album.id);
            res.json({ success: true, album: fullAlbum });
        } else {
            res.status(401).json({ error: 'Invalid passphrase' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/albums/:id/verify', async (req, res) => {
    try {
        const { passphrase } = req.body;
        const album = await dbHelpers.getAlbum(req.params.id);
        
        if (!album) return res.status(404).json({ error: 'Album not found' });
        
        if (album.passphrase === passphrase) {
            res.json({ success: true, album });
        } else {
            res.status(401).json({ error: 'Invalid passphrase' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/images/:id/feedback', async (req, res) => {
    try {
        const { feedback, is_selected } = req.body;
        await dbHelpers.updateImageFeedback(req.params.id, feedback, is_selected);
        res.json({ message: 'Feedback updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update feedback' });
    }
});



// ===== CLIENT TOKEN ROUTE (Must be last) =====
app.get('/:token', async (req, res, next) => {
    const token = req.params.token;
    // Ignore static files or API routes
    if (token.includes('.') || token === 'api' || token === 'admin') return next();
    
    try {
        const album = await dbHelpers.getAlbumByToken(token);
        if (album) {
            res.sendFile(path.join(__dirname, 'public', 'private-album.html'));
        } else {
            next();
        }
    } catch (error) {
        next();
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
