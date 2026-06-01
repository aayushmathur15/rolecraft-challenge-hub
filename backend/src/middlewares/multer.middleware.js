import fs from "fs";
import path from "path";
import multer from "multer";

const tempDir = path.join(process.cwd(), "public", "temp");
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

export const upload = multer({
  storage,
});