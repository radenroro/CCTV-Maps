require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const port = process.env.PORT || 5000;

//Config to connecting PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//Middleware
app.use(cors());
app.use(express.json());

//Endpoint untuk mendapatkan semua data CCTV
app.get("/api/cctv", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, detail, jaringan, nvr, lokasi, ST_AsGeoJSON(location) AS location, merk, model, rtsp_url FROM cctv"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error Saat Mengambil Data CCTV", error);
    res.status(500).json({ error: "Server Error" });
  }
});

//Endpoint untuk stream RTSP ke HTTP (HLS)
app.get("/api/stream/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT rtsp_url FROM cctv WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Data CCTV tidak ditemukan" });
    }

    const rtspUrl = result.rows[0].rtsp_url;
    res.header("Content-Type", "video/mp4");

    const stream = ffmpeg(rtspUrl)
      .inputOptions(["-rtsp_transport tcp"])
      .outputOptions(["-preset ultrafast", "-tune zerolatency", "-f mp4"])
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res
          .status(500)
          .json({ error: "Streaming error atau RTSP tidak dapat diakses" });
      })
      .pipe(res, { end: true });

    req.on("close", () => {
      console.log(`Streaming CCTV ID ${id} dihentikan oleh client`);
      stream.kill("SIGKILL"); // Hentikan proses jika client menutup koneksi
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Gagal memproses stream CCTV" });
  }
});

//Endpoint untuk mendapatkan satu data CCTV berdasarkan ID
app.get("/api/cctv/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, detail, jaringan, nvr, lokasi, ST_AsGeoJSON(location) AS location, merk, model, rtsp_url FROM cctv WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Data CCTV Tidak Ditemukan" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error Saat Mengambil Data CCTV", error);
    res.status(500).json({ error: "Server Error" });
  }
});

//Run Server
app.listen(port, () => {
  console.log("Server Berjalan di http://localhost:${port}");
});
