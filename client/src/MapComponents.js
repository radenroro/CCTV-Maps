import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const cctvIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/2776/2776067.png",
  iconSize: [30, 30],
});

const AutoCenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const extractKecamatan = (lokasiString) => {
  if (!lokasiString) return "Tidak Diketahui";
  const lowerCaseLokasi = lokasiString.toLowerCase();
  const surabayaKecamatan = [
    "genteng", "wonokromo", "rungkut", "sukolilo", "gubeng", "kenjeran",
    "tambaksari", "semampir", "asemrowo", "benowo", "pakal", "dukuh pakis",
    "karang pilang", "wiyung", "gunung anyar", "pabean cantikan",
    "simokerto", "tegalsari", "banyuurip", "sambikerep", "mulyorejo",
    "tandes", "bulak", "wonocolo", "gayungan", "jambangan", "ketintang",
    "ngagel", "keputih", "lakarsantri", "tenggilis mejoyo", "krembangan", "bubutan", "sawahan"
  ];

  for (const kec of surabayaKecamatan) {
    if (lowerCaseLokasi.includes(kec)) {
      return kec.charAt(0).toUpperCase() + kec.slice(1);
    }
  }

  const parts = lokasiString.split(',').map(part => part.trim());
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.length > 2 && !lastPart.includes("Jl.")) {
    return lastPart;
  }
  return "Tidak Diketahui";
};

const MapComponents = () => {
  const [cctvData, setCctvData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(1000);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/cctv")
      .then((res) => setCctvData(res.data))
      .catch((err) => console.error("Gagal mengambil data:", err));
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setSelectedLocation([latitude, longitude]);
      }, (err) => {
        console.error("Error getting user location:", err);
        setSelectedLocation([-7.2575, 112.7508]);
      });
    } else {
      alert("Geolocation tidak tersedia. Peta difokuskan ke Surabaya.");
      setSelectedLocation([-7.2575, 112.7508]);
    }
  }, []);

  const nearbyCctvSorted = useMemo(() => {
    if (!userLocation || searchTerm) return [];
    return cctvData
      .map((cctv) => {
        const coords = JSON.parse(cctv.location).coordinates;
        const dist = haversineDistance(userLocation[0], userLocation[1], coords[1], coords[0]);
        return { ...cctv, distance: dist };
      })
      .filter((cctv) => cctv.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation, radius, cctvData, searchTerm]);

  const searchedNearbyCctv = useMemo(() => {
    if (!selectedLocation || !searchTerm) return [];
    return cctvData
      .map((cctv) => {
        const coords = JSON.parse(cctv.location).coordinates;
        const dist = haversineDistance(selectedLocation[0], selectedLocation[1], coords[1], coords[0]);
        return { ...cctv, distance: dist };
      })
      .filter((cctv) => cctv.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [selectedLocation, radius, cctvData, searchTerm]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      alert("Silakan masukkan kata kunci pencarian.");
      return;
    }
    const result = cctvData.find((cctv) =>
      cctv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cctv.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (result) {
      const coords = JSON.parse(result.location).coordinates;
      setSelectedLocation([coords[1], coords[0]]);
    } else {
      alert("CCTV tidak ditemukan");
    }
  };

  const cctvPerKecamatan = useMemo(() => {
    const counts = {};
    cctvData.forEach(cctv => {
      const kecamatan = extractKecamatan(cctv.lokasi);
      counts[kecamatan] = (counts[kecamatan] || 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [cctvData]);

  return (
    <div>
      {/* Search Bar */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, background: "#fff", padding: "10px 20px", borderRadius: "999px",
        display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <input
          type="text"
          placeholder="Cari lokasi/nama CCTV..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ padding: "8px 16px", borderRadius: "999px", border: "1px solid #ccc", width: "250px" }}
        />
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <span>{radius} m</span>
        <button
          onClick={handleSearch}
          style={{ padding: "8px 12px", background: "#007BFF", color: "#fff", border: "none", borderRadius: "8px" }}
        >Cari</button>
      </div>

      {/* Sidebar Kiri - CCTV Terdekat */}
      <div style={{
        position: "absolute", top: 80, left: 20, zIndex: 1000, width: "260px",
        background: "#ffffffee", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        height: "calc(90vh - 80px)", overflowY: "auto"
      }}>
        <h3 style={{ color: "#007BFF" }}>📍 CCTV Terdekat ({nearbyCctvSorted.length})</h3>
        {nearbyCctvSorted.map((cctv) => (
          <div key={cctv.id}
            style={{ padding: "10px", marginBottom: "10px", background: "#f5f5f5", borderRadius: "8px", cursor: "pointer" }}
            onClick={() => {
              const coords = JSON.parse(cctv.location).coordinates;
              setSelectedLocation([coords[1], coords[0]]);
            }}>
            <strong>{cctv.name}</strong><br />
            <span style={{ fontSize: "12px" }}>{cctv.lokasi}</span><br />
            <span style={{ fontSize: "11px", color: "#888" }}>{(cctv.distance / 1000).toFixed(2)} km</span>
          </div>
        ))}

        <h3 style={{ marginTop: 20, color: '#007BFF' }}>📊 Sebaran per Area</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {cctvPerKecamatan.map(([kecamatan, count]) => (
            <li key={kecamatan} style={{
              backgroundColor: "#eef", borderRadius: "5px", padding: "8px",
              marginBottom: "5px", fontSize: "14px", display: 'flex', justifyContent: 'space-between'
            }}>
              <strong>{kecamatan}</strong> <span>{count} CCTV</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sidebar Kanan - Hasil Radius dari Lokasi Pencarian */}
      {searchTerm && (
        <div style={{
          position: "absolute", top: 80, right: 20, zIndex: 1000, width: "260px",
          background: "#ffffffee", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          height: "calc(90vh - 80px)", overflowY: "auto"
        }}>
          <h3 style={{ color: "#28a745" }}>📍 Radius di Lokasi Pencarian ({searchedNearbyCctv.length})</h3>
          {searchedNearbyCctv.length > 0 ? (
            searchedNearbyCctv.map((cctv) => {
              const coords = JSON.parse(cctv.location).coordinates;
              return (
                <div key={cctv.id}
                  style={{ padding: "10px", marginBottom: "10px", background: "#f0fff4", borderRadius: "8px", cursor: "pointer" }}
                  onClick={() => setSelectedLocation([coords[1], coords[0]])}
                >
                  <strong>{cctv.name}</strong><br />
                  <span style={{ fontSize: "12px" }}>{cctv.lokasi}</span><br />
                  <span style={{ fontSize: "11px", color: "#888" }}>{(cctv.distance / 1000).toFixed(2)} km</span>
                </div>
              );
            })
          ) : (
            <p style={{ fontSize: "14px", color: "#666" }}>Tidak ada CCTV dalam radius {radius} m.</p>
          )}
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={userLocation || [-7.2575, 112.7508]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {selectedLocation && <AutoCenter position={selectedLocation} />}
        {selectedLocation && (
          <Circle center={selectedLocation} radius={radius} pathOptions={{ color: searchTerm ? "green" : "blue", weight: 2, dashArray: searchTerm ? "5, 10" : null }} />
        )}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}
        <MarkerClusterGroup>
          {cctvData.map((cctv) => {
            const coords = JSON.parse(cctv.location).coordinates;
            return (
              <Marker key={cctv.id} position={[coords[1], coords[0]]} icon={cctvIcon}>
                <Popup>
                  <strong>{cctv.name}</strong><br />
                  {cctv.lokasi}<br />
                  <video width="250" controls>
                    <source src={`http://localhost:5000/api/stream/${cctv.id}`} type="video/mp4" />
                    Browser tidak mendukung video.
                  </video>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapComponents;
