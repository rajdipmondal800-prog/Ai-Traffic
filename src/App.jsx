import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Map, 
  BarChart3, 
  Activity, 
  Zap, 
  Car, 
  AlertTriangle,
  TrendingDown,
  Wind
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './index.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Map coords for a mock city center (e.g., London)
const mapCenter = [51.505, -0.09];

// Mock Routes - Eco vs Standard
const standardRoute = [
  [51.505, -0.09], [51.51, -0.1], [51.515, -0.12]
];
const ecoRoute = [
  [51.505, -0.09], [51.49, -0.08], [51.48, -0.1], [51.515, -0.12]
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [co2Saved, setCo2Saved] = useState(12450);
  const [activeVehicles, setActiveVehicles] = useState(8432);
  
  // Real-time tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCo2Saved(prev => prev + Math.floor(Math.random() * 5));
      setActiveVehicles(prev => prev + (Math.floor(Math.random() * 10) - 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Chart configs
  const emissionsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Standard Routing (kg CO₂)',
        data: [4500, 4800, 4600, 5000, 5200, 3800, 3500],
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'EcoRoute AI (kg CO₂)',
        data: [3200, 3400, 3100, 3600, 3800, 2500, 2200],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#a0aec0',
          font: { family: "'Inter', sans-serif" }
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a0aec0' }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#a0aec0' }
      }
    }
  };

  const trafficData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Congestion Level %',
        data: [15, 10, 85, 60, 90, 40],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="container header-content">
          <div className="logo">
            <Leaf className="logo-icon" size={28} />
            <span>EcoTraffic AI</span>
          </div>
          <nav className="nav-links">
            <a href="#" className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</a>
            <a href="#" className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>Live Map</a>
            <a href="#">Analysis</a>
            <a href="#">Settings</a>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Hero Section */}
        <section className="hero">
          <h1 className="title-main">
            Smart Traffic Prediction for<br/>
            <span className="text-gradient">Reducing Urban Carbon Emissions</span>
          </h1>
          <p>
            AI-driven dynamic routing to minimize congestion, reduce fuel consumption, 
            and create greener, more breathable cities.
          </p>
          
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="value">{co2Saved.toLocaleString()} kg</div>
              <div className="label">CO₂ Emissions Prevented</div>
            </div>
            <div className="hero-stat-item">
              <div className="value">{activeVehicles.toLocaleString()}</div>
              <div className="label">Vehicles Re-routed</div>
            </div>
            <div className="hero-stat-item">
              <div className="value">24%</div>
              <div className="label">Avg Congestion Reduction</div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <section className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-col">
            <div className="glass-panel">
              <h2 className="panel-title">
                <Activity size={20} color="#3b82f6" />
                Live Traffic Analytics
              </h2>
              
              <div className="stats-grid">
                <div className="stat-card blue">
                  <span className="stat-label">Current Congestion</span>
                  <div className="stat-value">Moderate</div>
                  <div className="stat-change negative">
                    <TrendingDown size={14} /> -12% vs last hour
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Air Quality Index</span>
                  <div className="stat-value">42 (Good)</div>
                  <div className="stat-change positive">
                    <Wind size={14} /> Improving
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <Bar data={trafficData} options={chartOptions} />
              </div>
            </div>

            <div className="alert-popup">
              <AlertTriangle className="alert-icon" size={24} />
              <div className="alert-content">
                <h4>AI Recommendation Active</h4>
                <p>Heavy congestion detected on Main St. Rerouting traffic through Park Ave to reduce stop-and-go emissions by an estimated 18%.</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-col">
            <div className="glass-panel">
              <h2 className="panel-title">
                <Map size={20} color="#10b981" />
                Eco-Routing Map
              </h2>
              <div className="map-container">
                <div className="map-overlay">
                  <div className="route-item">
                    <div className="route-color" style={{ background: '#ef4444' }}></div>
                    <div className="route-info">
                      <strong>Standard Route</strong>
                      Est. Emissions: 2.4kg CO₂
                    </div>
                  </div>
                  <div className="route-item">
                    <div className="route-color" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                    <div className="route-info">
                      <strong>AI Eco-Route</strong>
                      Est. Emissions: 1.8kg CO₂
                    </div>
                  </div>
                </div>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  <Polyline positions={standardRoute} color="#ef4444" weight={4} opacity={0.7} />
                  <Polyline positions={ecoRoute} color="#10b981" weight={5} />
                  <Marker position={[51.505, -0.09]}>
                    <Popup>Origin</Popup>
                  </Marker>
                  <Marker position={[51.515, -0.12]}>
                    <Popup>Destination</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '2rem' }}>
              <h2 className="panel-title">
                <BarChart3 size={20} color="#10b981" />
                Emission Reduction Impact
              </h2>
              <div className="chart-container" style={{ height: '220px' }}>
                <Line data={emissionsData} options={chartOptions} />
              </div>
            </div>
          </div>
        </section>

        {/* Value Prop Section */}
        <section className="features">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Car size={28} />
            </div>
            <h3>Smart Rerouting</h3>
            <p>Our AI model predicts traffic buildup before it happens and dynamically suggests alternative paths to keep city traffic flowing smoothly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Leaf size={28} />
            </div>
            <h3>Emission Targeting</h3>
            <p>Routes are optimized not just for time, but to minimize stop-and-go driving which produces the highest levels of vehicle emissions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Zap size={28} />
            </div>
            <h3>City Planner Insights</h3>
            <p>Provides actionable data to city officials to design better infrastructure and pinpoint high-pollution traffic choke points.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
