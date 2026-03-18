import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, Map, BarChart3, Activity, Zap, Car, AlertTriangle, TrendingDown,
  Wind, CloudRain, CalendarDays, Construction, Ambulance, Clock, Flag,
  Award, HelpCircle, ThumbsUp, MapPin, Siren, ChevronRight, X, ShieldAlert,
  ParkingCircle
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './index.css';
import './App.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Indian Map Coordinates (West Bengal)
const WB_CENTER = [23.6812, 87.6775];
const LOCATIONS = { accidentProne: [24.1013, 88.2721] }; // Murshidabad
const MAP_ZOOM_DASHBOARD = 7;
const MAP_ZOOM_SIM = 7;

// Routes (Kolkata to Siliguri)
const standardRoute = [
  [22.5726, 88.3639], // Kolkata
  [23.2324, 87.8615], // Burdwan
  [24.1013, 88.2721], // Murshidabad
  [25.0108, 88.1411], // Malda
  [26.7271, 88.3953]  // Siliguri
];

const ecoRoute = [
  [22.5726, 88.3639],
  [23.2599, 87.8569], 
  [23.5204, 87.3119], // Durgapur
  [25.0108, 88.1411], 
  [26.7271, 88.3953]
];

const emergencyRoute = [
  [22.5726, 88.3639], 
  [23.2324, 87.8615], 
  [25.0108, 88.1411], 
  [26.7271, 88.3953]
];

// Nodes for Traffic Lights
const trafficNodes = [
  { id: 1, pos: [23.2324, 87.8615] }, // Burdwan
  { id: 2, pos: [25.0108, 88.1411] }  // Malda
];

// Smart Parking spots
const parkingSpots = [
  { id: 1, pos: [22.5726, 88.3639], empty: true }, // Kolkata
  { id: 2, pos: [23.5204, 87.3119], empty: false },// Durgapur
  { id: 3, pos: [26.7271, 88.3953], empty: true }, // Siliguri
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real-time Global Data
  const [co2Saved, setCo2Saved] = useState(12450);
  const [activeVehicles, setActiveVehicles] = useState(8432);
  const [userPoints, setUserPoints] = useState(450);
  
  // Dashboard Features
  const [timeOffset, setTimeOffset] = useState('live'); // 7. AI Prediction (live, 15m, 30m, 1h)
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Simulation Features (The 10 Features)
  const [isRaining, setIsRaining] = useState(false); // 9. Weather Control
  const [accidentActive, setAccidentActive] = useState(false); // 6. Accident Detection
  const [emergencyMode, setEmergencyMode] = useState(false); // 1. Emergency Priority
  const [signalStates, setSignalStates] = useState({ 1: 'green', 2: 'red' }); // 3. Adaptive Lights
  
  // Simulation Vehicles State
  const [simProgress, setSimProgress] = useState(0);

  // Global Real-time tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCo2Saved(prev => prev + Math.floor(Math.random() * 5));
      setActiveVehicles(prev => prev + (Math.floor(Math.random() * 10) - 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animation Loop for Simulation View
  useEffect(() => {
    if (activeTab !== 'simulation') return;
    
    // Feature 3: Adaptive Lights & Feature 1: Emergency Mode
    const signalInterval = setInterval(() => {
      setSignalStates(prev => {
        if (emergencyMode) {
          return { 1: 'green', 2: 'green' }; // Force all green for ambulance
        }
        // Normal adaptive toggling (simulate based on queue, but random here for visual)
        return {
          1: prev[1] === 'green' ? 'red' : 'green',
          2: prev[2] === 'green' ? 'red' : 'green'
        };
      });
    }, isRaining ? 6000 : 4000); // Feature 9: Rain increases green time cycles

    return () => clearInterval(signalInterval);
  }, [activeTab, emergencyMode, isRaining]);

  // Interpolate vehicle position for smooth movement
  useEffect(() => {
    if (activeTab !== 'simulation') return;
    
    let animationFrame;
    let progress = 0;
    
    // Feature 9 & 6: Weather & Accidents affect speed
    let baseSpeed = 0.002;
    if (isRaining) baseSpeed *= 0.6; // Slower in rain
    if (accidentActive) baseSpeed *= 0.1; // Crawl in accident
    if (emergencyMode) baseSpeed *= 2.0; // Ambulance is fast

    const animate = () => {
      progress += baseSpeed;
      if (progress > 1) progress = 0;
      setSimProgress(progress);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [activeTab, isRaining, accidentActive, emergencyMode]);

  // Helper to get position along a route array
  const getInterpolatedPosition = (routeArray, prog) => {
    if (!routeArray || routeArray.length < 2) return routeArray[0];
    const totalSegments = routeArray.length - 1;
    const scaledProg = prog * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledProg), totalSegments - 1);
    const segmentProg = scaledProg - segmentIndex;
    
    const p1 = routeArray[segmentIndex];
    const p2 = routeArray[segmentIndex + 1];
    
    return [
      p1[0] + (p2[0] - p1[0]) * segmentProg,
      p1[1] + (p2[1] - p1[1]) * segmentProg
    ];
  };

  // Generate Feature 7: AI Prediction Data
  const getTrafficData = () => {
    let multiplier = timeOffset === 'live' ? 1 : timeOffset === '15m' ? 1.2 : timeOffset === '30m' ? 1.5 : 1.8;
    return {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [
        {
          label: `Congestion Level % (${timeOffset})`,
          data: [15, 10, Math.min(100, 85 * multiplier), Math.min(100, 60 * multiplier), Math.min(100, 90 * multiplier), 40],
          backgroundColor: timeOffset === 'live' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(245, 158, 11, 0.7)',
          borderRadius: 4,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#a0aec0', font: { family: "'Inter', sans-serif" } } } },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } },
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } }
    }
  };

  const currentVehiclePos = getInterpolatedPosition(emergencyMode ? emergencyRoute : standardRoute, simProgress);

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="container header-content">
          <div className="logo">
            <Leaf className="logo-icon" size={28} />
            <span>EcoTraffic AI (West Bengal)</span>
          </div>
          <nav className="nav-links">
            <div className="nav-menu">
              <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <Activity size={16} style={{display:'inline', marginRight:'6px'}}/>
                Dashboard
              </button>
              <button className={`nav-btn ${activeTab === 'simulation' ? 'active' : ''}`} onClick={() => setActiveTab('simulation')}>
                <Map size={16} style={{display:'inline', marginRight:'6px'}}/>
                City Simulation (Live)
              </button>
            </div>
            
            <div className="user-actions">
              <div className="gamification-badge">
                <Award size={18} color="#f59e0b" />
                <span>{userPoints} pts</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowReportModal(true)}>
                <AlertTriangle size={16} /> Report
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container">
        
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {/* Feature 2: Eco-Friendly System Display */}
            <section className="hero">
              <h1 className="title-main">
                Smart Traffic Prediction for<br/>
                <span className="text-gradient">Reducing Urban Carbon Emissions</span>
              </h1>
              
              <div className="eco-notice-banner mt-4 mb-4" style={{background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid #10b981', display: 'inline-block'}}>
                <Leaf color="#10b981" size={20} style={{verticalAlign: 'middle', marginRight: '8px'}}/>
                <strong style={{color: '#10b981', fontSize: '1.2rem'}}>You saved 2.4 kg CO₂ today</strong> by using Eco-Routes!
              </div>

              <div className="hero-stats">
                <div className="hero-stat-item">
                  <div className="value">{co2Saved.toLocaleString()} kg</div>
                  <div className="label">Total CO₂ Prevented</div>
                </div>
                <div className="hero-stat-item">
                  <div className="value">{(co2Saved * 1.5).toLocaleString()} L</div>
                  <div className="label">Fuel Waste Avoided</div>
                </div>
                <div className="hero-stat-item">
                  <div className="value blue-text">{activeVehicles.toLocaleString()}</div>
                  <div className="label">Active AI Monitored Nodes</div>
                </div>
              </div>
            </section>

            {/* Feature 4: Real-Time Dashboard */}
            <section className="dashboard-grid">
              {/* Left Column */}
              <div className="dashboard-col">
                <div className="glass-panel">
                  <div className="panel-header-row">
                    <h2 className="panel-title mb-0 border-0 pb-0">
                      <BarChart3 size={20} color="#3b82f6" />
                      AI Traffic Prediction
                    </h2>
                    <div className="time-tabs">
                      {/* Feature 7: Prediction Slider/Tabs */}
                      {['live', '15m', '30m', '1h'].map(t => (
                        <button key={t} className={`time-tab ${timeOffset === t ? 'active' : ''}`} onClick={() => setTimeOffset(t)}>
                          {t === 'live' ? 'Live' : `+${t}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="chart-container">
                    <Bar data={getTrafficData()} options={chartOptions} />
                  </div>
                </div>

                <div className="alert-popup explainable-ai-card">
                  <HelpCircle className="alert-icon" size={24} color="#a855f7" />
                  <div className="alert-content">
                    <h4 style={{ color: '#a855f7' }}>AI Insight Engine</h4>
                    <p>
                      <strong>Malda Highway:</strong> 90% likelihood of severe jam in 15 mins due to 
                      <span className="highlight-tag">Heavy Rain</span> + <span className="highlight-tag">Rush Hour</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column (Delhi Map) */}
              <div className="dashboard-col">
                <div className="glass-panel">
                  <h2 className="panel-title">
                    <Map size={20} color="#10b981" />
                    West Bengal Live Map
                  </h2>
                  <div className="map-container">
                    <div className="map-overlay">
                      <div className="route-item">
                        <div className="route-color" style={{ background: '#ef4444' }}></div>
                        <div className="route-info"><strong>Traffic Path</strong></div>
                      </div>
                      <div className="route-item">
                        <div className="route-color" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        <div className="route-info"><strong>AI Eco-Route</strong></div>
                      </div>
                    </div>
                    <MapContainer center={WB_CENTER} zoom={MAP_ZOOM_DASHBOARD} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
                        attribution='&copy; Google Maps'
                      />
                      <Polyline positions={standardRoute} color={timeOffset === 'live' ? "#ef4444" : "#991b1b"} weight={4} opacity={0.7} />
                      <Polyline positions={ecoRoute} color="#10b981" weight={5} />
                      
                      {timeOffset !== 'live' && (
                        <CircleMarker center={LOCATIONS.accidentProne} radius={15} color="#f59e0b" fillColor="#f59e0b" fillOpacity={0.4}>
                          <Popup>Predicted Jam in {timeOffset}</Popup>
                        </CircleMarker>
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --- TAB 2: SIMULATION (Feature 10) --- */}
        {activeTab === 'simulation' && (
          <div className="fade-in sim-tab-wrapper">
            
            <div className="sim-controls glass-panel mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2><Activity size={24} style={{display:'inline', verticalAlign:'middle'}} color="#3b82f6"/> City Interactive Simulation</h2>
                <p style={{color: '#a0aec0', fontSize: '0.9rem', marginTop: '0.5rem'}}>Control the environment directly and watch AI adapt in real-time.</p>
              </div>
              
              <div className="sim-buttons" style={{ display: 'flex', gap: '1rem' }}>
                {/* Feature 9: Weather */}
                <button className={`btn ${isRaining ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsRaining(!isRaining)} style={{background: isRaining ? '#3b82f6' : ''}}>
                  {isRaining ? <CloudRain size={18}/> : <Wind size={18}/>}
                  {isRaining ? 'Heavy Rain (Active)' : 'Weather: Clear'}
                </button>
                
                {/* Feature 6: Accidents */}
                <button className={`btn ${accidentActive ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAccidentActive(!accidentActive)} style={{background: accidentActive ? '#ef4444' : ''}}>
                  <ShieldAlert size={18}/>
                  {accidentActive ? 'Accident Detected!' : 'Trigger Accident'}
                </button>

                {/* Feature 1: Emergency Vehicle */}
                <button className={`btn ${emergencyMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {
                  setEmergencyMode(!emergencyMode);
                  if(!emergencyMode) setSimProgress(0); // Reset progress to start of route
                }} style={{background: emergencyMode ? '#f59e0b' : '', color: emergencyMode ? '#000' : ''}}>
                  {emergencyMode ? <Siren size={18} className="pulse-anim"/> : <Ambulance size={18}/>}
                  {emergencyMode ? 'Emergency Priority ON' : 'Spawn Ambulance'}
                </button>
              </div>
            </div>

            <div className="sim-map-large glass-panel" style={{ height: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Contextual UI Overlays for Simulation events */}
              <div style={{display:'flex', gap:'1rem', minHeight: '60px'}}>
                {emergencyMode && (
                  <div className="alert-popup w-100 mt-0" style={{background: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b'}}>
                    <Siren color="#f59e0b" className="pulse-anim" />
                    <div><strong style={{color:'#fcd34d'}}>EMERGENCY PRIORITY ACTIVE:</strong> Forcing all signals Green. AI notifying 42 nearby vehicles to yield.</div>
                  </div>
                )}
                {accidentActive && (
                  <div className="alert-popup w-100 mt-0" style={{background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444'}}>
                    <ShieldAlert color="#ef4444" />
                    <div><strong style={{color:'#fca5a5'}}>COLLISION DETECTED (CCTV):</strong> Halting traffic. Rerouting via EcoRoute.</div>
                  </div>
                )}
                {isRaining && (
                  <div className="alert-popup w-100 mt-0" style={{background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6'}}>
                    <CloudRain color="#3b82f6" />
                    <div><strong style={{color:'#93c5fd'}}>WEATHER EVENT:</strong> Expanding Signal Green Timers to compensate for slow traffic.</div>
                  </div>
                )}
              </div>

              <div className="map-container" style={{ flexGrow: 1, borderRadius: '12px', border: '1px solid #333' }}>
                <MapContainer center={WB_CENTER} zoom={MAP_ZOOM_SIM} style={{ height: '100%', width: '100%' }}>
                  <TileLayer 
                    url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}" 
                    attribution='&copy; Google Maps'
                  />
                  
                  {/* Routes */}
                  <Polyline positions={standardRoute} color="#475569" weight={6} opacity={0.4} />
                  {emergencyMode && <Polyline positions={emergencyRoute} color="#f59e0b" weight={4} dashArray="10, 10" className="path-anim" />}
                  
                  {/* Feature 3: Traffic Lights */}
                  {trafficNodes.map(node => (
                    <CircleMarker 
                      key={node.id} 
                      center={node.pos} 
                      radius={8} 
                      color={signalStates[node.id] === 'green' ? '#10b981' : '#ef4444'} 
                      fillColor={signalStates[node.id] === 'green' ? '#10b981' : '#ef4444'} 
                      fillOpacity={0.8}
                    >
                      <Popup>Smart Light {node.id}: {signalStates[node.id].toUpperCase()}</Popup>
                    </CircleMarker>
                  ))}

                  {/* Feature 8: Smart Parking */}
                  {parkingSpots.map(spot => (
                    <Marker 
                      key={spot.id} 
                      position={spot.pos}
                      icon={L.divIcon({
                        className: `parking-icon ${spot.empty ? 'empty' : 'full'}`,
                        html: `<div style="background: ${spot.empty ? '#10b981' : '#ef4444'}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #fff;">P</div>`,
                        iconSize: [24,24]
                      })}
                    >
                      <Popup>Parking: {spot.empty ? 'Available' : 'Full'}</Popup>
                    </Marker>
                  ))}

                  {/* The Moving Vehicle */}
                  <Marker 
                    position={currentVehiclePos}
                    icon={L.divIcon({
                      className: 'moving-car',
                      html: `<div style="background: ${emergencyMode ? '#f59e0b' : '#3b82f6'}; box-shadow: 0 0 15px ${emergencyMode ? '#f59e0b' : '#3b82f6'}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
                      iconSize: [16,16]
                    })}
                  >
                     <Popup>{emergencyMode ? 'Ambulance Unit 4' : 'Citizen Vehicle'}</Popup>
                  </Marker>
                  
                  {/* Accident Marker UI */}
                  {accidentActive && (
                    <Marker position={LOCATIONS.accidentProne} 
                      icon={L.divIcon({
                        className: 'accident-pulse',
                        html: `<div style="font-size: 24px;">💥</div>`,
                        iconSize: [24,24]
                      })}
                    />
                  )}

                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {/* Feature 5: Public App / Report Incident (Feature 5 + Gamification) */}
        {showReportModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-panel fade-in">
              <button className="close-btn" onClick={() => setShowReportModal(false)}><X size={20}/></button>
              <h3><MapPin size={20} color="#3b82f6" style={{verticalAlign:'middle'}}/> Public Traffic App</h3>
              <p className="modal-sub">Help the community by reporting live road events. Earn Eco Points!</p>
              
              <div className="eco-notice-banner mt-4" style={{background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #3b82f6'}}>
                <strong>Quick Alert:</strong> Heavy traffic on Outer Ring Road. Switch to Eco-Route to save 0.5kg CO₂.
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setUserPoints(p => p + 50);
                setShowReportModal(false);
                alert("Incident Verified by AI. You earned 50 Eco Points!");
              }} className="report-form mt-4">
                <div className="form-group">
                  <label>Incident Type</label>
                  <select required>
                    <option value="">Select type...</option>
                    <option value="accident">Accident (Major Collision)</option>
                    <option value="jam">Severe Traffic Jam</option>
                    <option value="construction">Road Closure / Construction</option>
                    <option value="weather">Hazardous Weather (Flood/Fog)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location (Auto-detected)</label>
                  <div className="location-input">
                    <MapPin size={16} color="#a0aec0" />
                    <input type="text" defaultValue="Kolkata, West Bengal" readOnly />
                  </div>
                </div>
                <div className="points-reward">
                  <Award size={16} color="#f59e0b" />
                  <span>You will earn <strong>+50 Eco Points</strong> for a verified report.</span>
                </div>
                <button type="submit" className="btn btn-primary w-100 mt-4">Submit to Network</button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
