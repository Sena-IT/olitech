import React, { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  Polyline,
  Marker,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";
import { getChatResponse } from "@/app/action";
import { useChatContext } from "@/provider/ChatProvider";
import { MdMyLocation } from "react-icons/md"; 

const containerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 13.0827,
  lng: 80.2707,
};

interface LatLng {
  lat: number;
  lng: number;
}

const GoogleMapContainer: React.FC = () => {
  const { chatResponse, setChatResponse, setDoc } = useChatContext();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: `${process.env.NEXT_PUBLIC_GMAP_API_KEY}`,
    libraries: ["geometry", "places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [path, setPath] = useState<LatLng[]>([]);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // Get user's live location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 0, 
      };
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);
          setCenter(newLocation);
          if (map) {
            map.panTo(newLocation);
            map.setZoom(15);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unable to retrieve your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was denied. Please enable it in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
          }
          alert(errorMessage);
        },
        options
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, [map]);


  const calculateMeasurements = useCallback((path: LatLng[]) => {
    if (!window.google?.maps?.geometry) return { distance: 0, area: 0 };
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const point1 = new window.google.maps.LatLng(path[i]);
      const point2 = new window.google.maps.LatLng(path[i + 1]);
      totalDistance +=
        window.google.maps.geometry.spherical.computeDistanceBetween(
          point1,
          point2
        );
    }
    let area = 0;
    if (path.length >= 3) {
      area = window.google.maps.geometry.spherical.computeArea(path);
    }
    return { distance: totalDistance, area };
  }, []);

  const formatMeasurements = (distance: number, area: number) => {
    const distanceKm = (distance / 1000).toFixed(2);
    const distanceFt = (distance * 3.28084).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
    const areaM2 = area.toLocaleString("en-US", { maximumFractionDigits: 2 });
    const areaFt2 = (area * 10.7639).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
    return { distanceKm, distanceFt, areaM2, areaFt2 };
  };

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    const newPoint: LatLng = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setPath((currentPath) => [...currentPath, newPoint]);
  }, []);

  const resetPath = useCallback(() => {
    setPath([]);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete) {
        const place = autocomplete.getPlace();
        console.log("Selected Place:", place); // Debugging
    
        if (place.geometry && place.geometry.location) {
          const newCenter = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setCenter(newCenter);
          if (map) {
            map.panTo(newCenter);
            map.setZoom(15);
          }
        } else {
          console.warn("No geometry found for this place.");
        }
      } else {
        console.warn("Autocomplete is not loaded yet.");
      }
  };

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  useEffect(() => {
    if (isLoaded && map) {
      getCurrentLocation();
    }
  }, [isLoaded, map, getCurrentLocation]);

  if (loadError) {
    console.error("Map loading error:", loadError.message);
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  const { distance, area } = calculateMeasurements(path);
  const { distanceKm, distanceFt, areaM2, areaFt2 } = formatMeasurements(
    distance,
    area
  );

  const sendCalculatedVal = async () => {
    const formData = new FormData();
    const sendQuery = `the calculated area for the plotted points is ${areaFt2}ft2`;
    formData.append("query", sendQuery);
    try {
      const response = await getChatResponse(formData);
      if (!response?.ok) throw new Error("Network response was not ok");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.replace("data: ", "");
            if (data === "[DONE]") continue;
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.error) {
                console.error("Stream error:", parsedData.error);
                setChatResponse((prev) => [
                  ...prev,
                  { message: parsedData.error, sender: "bot", map: false },
                ]);
              } else {
                const { content, map, classifier } = parsedData;
                setDoc(false);
                setChatResponse((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (
                    lastMessage.sender === "bot" &&
                    !lastMessage.message.includes("Document uploaded")
                  ) {
                    return [
                      ...prev.slice(0, -1),
                      { message: content, sender: "bot", map, classifier },
                    ];
                  }
                  return [
                    ...prev,
                    { message: content, sender: "bot", map, classifier },
                  ];
                });
              }
            } catch (error) {
              console.error("Error parsing stream data:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setChatResponse((prev) => [
        ...prev,
        { message: "An error occurred", sender: "bot", map: false },
      ]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
     
      <div className="mb-4 flex items-center space-x-4">
        <Autocomplete
          onLoad={(auto) => setAutocomplete(auto)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for a location"
            className="w-full p-2 border rounded-lg"
          />
        </Autocomplete>
        <button
          onClick={getCurrentLocation}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          title="Locate Me"
        >
          <MdMyLocation size={24} />
        </button>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          mapTypeId: "roadmap",
          styles: [
            {
              featureType: "all",
              elementType: "all",
              stylers: [{ cursor: "crosshair" }],
            },
          ],
          draggableCursor: "crosshair",
          draggingCursor: "crosshair",
        }}
      >
        {path.length > 0 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        )}
        {path.map((point, index) => (
          <Marker
            key={index}
            position={point}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: isLoaded
                ? new window.google.maps.Size(32, 32)
                : undefined,
            }}
          />
        ))}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: isLoaded
                ? new window.google.maps.Size(32, 32)
                : undefined,
            }}
            title="Your Location"
          />
        )}
      </GoogleMap>

      {/* Measurements and Buttons */}
      <div className="mt-2">
        <h3 className="font-medium">Measured distance:</h3>
        <p className="mt-3">Click on the map to add to your path</p>
        {path.length >= 3 && (
          <p className="mt-1.5">
            Total area: {areaM2} m² ({areaFt2} ft²)
          </p>
        )}
        {path.length > 0 && (
          <p className="mt-1.5">
            Total distance: {distanceKm} km ({distanceFt} ft)
          </p>
        )}
        <div className="flex flex-row items-center space-x-4">
          <button
            onClick={resetPath}
            className="w-fit px-4 py-2 rounded-xl bg-red-600 text-white mt-2"
          >
            Reset
          </button>
          <button
            onClick={sendCalculatedVal}
            disabled={areaFt2.trim() === ""}
            className="w-fit px-4 py-2 rounded-xl bg-green-600 text-white mt-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapContainer;