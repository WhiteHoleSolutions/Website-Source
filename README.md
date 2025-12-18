# White Hole Solutions Website

Professional business website with gallery management and customer inquiry system. Optimized for deployment on Render.com.

## Features

- **Modern Design**: Apple-inspired UI with glassmorphism and smooth animations
- **Photo Gallery**: Album-based gallery with image viewer (zoom, pan, mobile gestures)
- **Customer Inquiries**: Professional quote request system
- **Admin Panel**: Secure admin interface for managing gallery and inquiries
- **Mobile Optimized**: Fully responsive with touch gesture support
- **Image Protection**: Prevents easy downloading of gallery images
- **Dark Mode**: Automatic dark mode based on system preferences

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser:
   - Main Site: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin.html

### Admin Access

Press `CTRL + `` (backtick) on the main website and enter password: `admin123`

## File Structure

```
Final_Site/
├── public/                 # Static frontend files
│   ├── index.html         # Main website
│   ├── admin.html         # Admin panel
│   ├── css/               # Stylesheets
│   │   ├── styles.css     # Main styles
│   │   ├── modules.css    # Module styles
│   │   └── admin.css      # Admin styles
│   └── js/                # JavaScript files
│       ├── logo.js        # Logo animations
│       ├── script.js      # Main functionality
│       ├── gallery.js     # Gallery system
│       ├── inquiry.js     # Inquiry form
│       ├── admin-access.js  # Secret admin access
│       └── admin-panel.js   # Admin functionality
├── server.js              # Express server
├── database.js            # SQLite database
├── package.json           # Dependencies
├── .gitignore            # Git ignore rules
└── uploads/              # Image uploads directory

```

## Deployment to Render.com

### Step 1: Prepare Repository

1. Push the `Final_Site` folder to GitHub:
```bash
cd Final_Site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: white-hole-solutions
   - **Region**: Choose closest to your location
   - **Branch**: main
   - **Root Directory**: (leave empty if Final_Site is the root)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### Step 3: Environment Configuration

Add these environment variables in Render:
- `NODE_ENV`: production
- `PORT`: 3000 (Render auto-assigns, but good to set)

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (usually 2-5 minutes)
3. Your site will be live at: `https://your-app-name.onrender.com`

### Step 5: Configure Persistent Storage (Important!)

Render's free tier has ephemeral storage. For persistent uploads and database:

**Option A: Use Render Disk (Paid)**
- Add a Render Disk in your service settings
- Mount it to `/app/uploads` and `/app/database.db`

**Option B: Use External Storage (Recommended)**
- Use AWS S3, Cloudinary, or similar for image uploads
- Use external database like PostgreSQL (Render provides free tier)

## Database Schema

### Albums Table
```sql
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Images Table
```sql
CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);
```

### Inquiries Table
```sql
CREATE TABLE inquiries (
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
);
```

## API Endpoints

### Albums
- `GET /api/albums` - Get all albums
- `GET /api/albums/:id` - Get single album
- `POST /api/albums` - Create album (with file upload)
- `PUT /api/albums/:id` - Update album
- `DELETE /api/albums/:id` - Delete album

### Inquiries
- `GET /api/inquiries` - Get all inquiries
- `POST /api/inquiries` - Create inquiry
- `PATCH /api/inquiries/:id/read` - Mark as read
- `DELETE /api/inquiries/:id` - Delete inquiry

## Services Offered

1. **Photography & Videography**
   - Business: Products, Food, Venue, Properties, Events
   - Personal: Cars, Social Media, Weddings, Birthdays

2. **Branding & Design**
   - Business Cards, Uniforms, Websites, Social Media Graphics

3. **Social Media Management**
   - Post Scheduling, Content Creation, Account Management

4. **App Development**
   - Custom Python & Java Applications

## Security Notes

- Change default admin password in production
- Use HTTPS in production (Render provides free SSL)
- Consider adding rate limiting for API endpoints
- Implement proper authentication system for admin panel

## Performance Tips

- Images are automatically limited to 10MB
- Enable gzip compression in production
- Consider using CDN for static assets
- Optimize images before uploading

## Support

For issues or questions:
- Email: admin@White-hole-solutions.com
- Phone: 0480 588 980
- ABN: 83 665 063 890

## License

Copyright © 2025 White Hole Solutions. All rights reserved.
