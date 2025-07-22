import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage
let users = [];
let loadRequests = [];
let currentUserId = 1;
let currentLoadId = 1;

// API Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, companyName, role } = req.body;
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      id: currentUserId++,
      email,
      password: hashedPassword,
      companyName,
      role: role || "owner",
      createdAt: new Date()
    };
    
    users.push(user);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/loads", (req, res) => {
  res.json(loadRequests);
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "TruckFlow server running",
    users: users.length,
    loads: loadRequests.length 
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, "dist", "public")));

// Serve frontend
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" });
  } else {
    res.sendFile(path.join(__dirname, "dist", "public", "index.html"));
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TruckFlow running on port ${PORT} with API support`);
});
