const multer = require("multer");
const path = require("path");

//Définition des destinations pour les fichiers (Images & Vidéos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (/jpeg|jpg|png/.test(ext)) {
      cb(null, "Public/Images"); // Dossier pour les images
    } else if (/mp4|avi|mkv/.test(ext)) {
      cb(null, "Public/Videos"); // Dossier pour les vidéos
    } else if (/pdf|doc|docx/.test(ext)) {
      cb(null, "Public/CV"); // Dossier pour les CV
    } else {
      return cb(new Error("Format de fichier non autorisé"), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

// Filtrer les fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|mp4|avi|mkv|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    return cb(new Error("Seuls les fichiers JPEG, JPG, PNG, MP4, AVI et MKV sont autorisés"), false);
  }
};

//Middleware multer
const uploads = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = uploads;
