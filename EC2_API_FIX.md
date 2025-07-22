# 🔧 EC2 API Fix - Login Error Resolution

## The Issue
The simple server only serves static files but doesn't handle API requests. When you try to login, the frontend makes API calls that return HTML instead of JSON.

## Quick Fix

SSH into your EC2 and replace the simple server with this complete version:

```bash
# Stop current server
pm2 stop truckflow

# Create complete server with API routes
cat > complete-server.js << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo
let users = [];
let loadRequests = [];
let currentUserId = 1;
let currentLoadId = 1;

// API Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, companyName, role } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: currentUserId++,
      email,
      password: hashedPassword,
      companyName,
      role: role || 'owner',
      createdAt: new Date()
    };
    
    users.push(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/loads', (req, res) => {
  res.json(loadRequests);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TruckFlow server running',
    users: users.length,
    loads: loadRequests.length 
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Serve frontend for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TruckFlow running on port ${PORT} with API support`);
});
EOF

# Start the complete server
NODE_ENV=production pm2 start complete-server.js --name truckflow
pm2 save
```

This adds:
- User signup/login endpoints
- Password hashing with bcrypt
- Basic load management API
- Proper JSON responses
- In-memory storage (until database is connected)

After running this, you should be able to:
1. Create user accounts
2. Login successfully  
3. Access the dashboard
4. See the basic interface working

The login error will be resolved and you can use the application normally.