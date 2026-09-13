import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { INDIAN_REGIONS, Region, findRegionByCoordinates, getRegionName } from '../data/indianRegions';

// Helper for conditional classes
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Fix for default marker icon in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom green icon for regions
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom blue icon for user location
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMapProps {
  onRegionSelect: (region: Region) => void;
  language: string;
  t: any;
}

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationMarker = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 12);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={blueIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

const LocationMap: React.FC<LocationMapProps> = ({ onRegionSelect, language, t }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleMapClick = (lat: number, lng: number) => {
    const region = findRegionByCoordinates(lat, lng);
    if (region) {
      onRegionSelect(region);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLocating(false);
        
        // Also try to find a region for the user's location
        const region = findRegionByCoordinates(latitude, longitude);
        if (region) {
          onRegionSelect(region);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        alert('Unable to retrieve your location');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="h-100 w-full rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-inner relative z-0">
      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={handleMapClick} />
        <LocationMarker position={userLocation} />
        {INDIAN_REGIONS.map((region) => (
          <Marker 
            key={region.id} 
            position={[region.lat, region.lng]}
            icon={greenIcon}
            eventHandlers={{
              click: () => onRegionSelect(region),
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-emerald-800">{getRegionName(region, language as any)}</h3>
                <div className="text-xs space-y-1 mt-1">
                  <p>🌡️ {t.temperature}: {region.temp}°C</p>
                  <p>🌧️ {t.rainfall}: {region.rainfall}mm</p>
                  <p>🌱 {t.soil}: {region.soil}</p>
                  <p>📅 {t.season}: {region.seasons.join(', ')}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <button 
        onClick={requestLocation}
        disabled={isLocating}
        className="absolute top-4 right-4 z-1000 bg-white p-3 rounded-2xl shadow-lg hover:bg-emerald-50 transition-colors border border-emerald-100 flex items-center gap-2 group"
        title="Use my current location"
      >
        <Navigation className={cn("w-5 h-5 text-emerald-600", isLocating && "animate-spin")} />
        <span className="text-xs font-bold text-emerald-800 hidden sm:inline">
          {isLocating ? (language === 'en' ? 'Locating...' : 'खोज रहे हैं...') : (language === 'en' ? 'My Location' : 'मेरी स्थिति')}
        </span>
      </button>

      <div className="absolute bottom-4 left-4 z-1000 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm text-xs font-bold text-emerald-800 border border-emerald-100">
        {language === 'en' ? 'Click on a green marker or anywhere on map' : 'नक्शे पर कहीं भी या हरे निशान पर क्लिक करें'}
      </div>
    </div>
  );
};

export default LocationMap;
