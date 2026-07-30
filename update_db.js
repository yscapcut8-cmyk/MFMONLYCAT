const db = require('./database/connection');
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  console.log("Column 'role' added.");
} catch (e) {
  console.log("Column might already exist:", e.message);
}
const stmt = db.prepare("UPDATE users SET role = 'admin' WHERE email = 'yscapcut8@gmail.com'");
stmt.run();
console.log("Admin updated.");
