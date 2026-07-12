const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const seedUsers = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI not defined in environment variables!");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Sample users to seed
    const users = [
      {
        email: "admin@example.com",
        password: "admin123",
        name: "Admin User",
        role: "admin",
      },
      {
        email: "Admin@CBC.in",
        password: "admin123",
        name: "Sukhmanmeet Kaur",
        role: "admin",
      }
    ];

    console.log("\nSeeding users...");

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠ User ${userData.email} already exists. Skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      console.log(`✓ Created user: ${user.email} (${user.role})`);
      console.log(`  Password: ${userData.password}`);
    }

    console.log("\n✓ Seeding completed successfully!");
    console.log("\nTest credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:");
    console.log("  Email: admin@example.com");
    console.log("  Password: admin123");
    console.log("\nUser:");
    console.log("  Email: user@example.com");
    console.log("  Password: user123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedUsers();
