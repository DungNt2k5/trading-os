const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Copy .next/static → standalone/.next/static
const src = path.join(".next", "static");
const dest = path.join(".next", "standalone", ".next", "static");
if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log("✅ Copied .next/static → standalone/.next/static");
} else {
  console.error("❌ .next/static not found");
}

// Copy public → standalone/public
const pub = path.join("public");
const pubDest = path.join(".next", "standalone", "public");
if (fs.existsSync(pub)) {
  fs.cpSync(pub, pubDest, { recursive: true });
  console.log("✅ Copied public → standalone/public");
}

// Tạo thư mục prisma trong standalone
const prismaDir = path.join(".next", "standalone", "prisma");
fs.mkdirSync(prismaDir, { recursive: true });

// Copy migrations
const migrationsDir = path.join("prisma", "migrations");
const migrationsDest = path.join(prismaDir, "migrations");
if (fs.existsSync(migrationsDir)) {
  fs.cpSync(migrationsDir, migrationsDest, { recursive: true });
  console.log("✅ Copied prisma/migrations");
}

// Tạo data.db với migration
const dbPath = path.resolve(prismaDir, "data.db");
console.log("🔄 Creating data.db...");
try {
  execSync(`npx prisma migrate deploy`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: `file:${dbPath}`,
    },
  });
  console.log("✅ data.db created!");
} catch (e) {
  console.error("❌ Migration failed:", e.message);
}

// Copy native libsql module
const libsqlSrc = path.join("node_modules", "@libsql");
const libsqlDest = path.join(".next", "standalone", "node_modules", "@libsql");
if (fs.existsSync(libsqlSrc)) {
  fs.cpSync(libsqlSrc, libsqlDest, { recursive: true });
  console.log("✅ Copied @libsql native modules");
}

console.log("🚀 Bundle ready!");
