import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET is not set in environment. Using fallback.");
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    throw err; // ensure it still returns 401
  }
}
