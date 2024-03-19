"use client";

import { Autocomplete, useJsApiLoader, GoogleMap, Libraries, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Button, Spinner, TextInput } from "flowbite-react";
import { useEffect, useRef, useState } from "react";

interface TrajetContent {
    temps_trajet: number;
    bornes: [number, number][];
}

export interface MapProps {
    autonomie: number; // En mètres
    temps_recharge: number; // En minutes
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAwpZBPoJW6OqEl4VAtWItVN9icovVuqnw";
const GOOGLE_MAPS_MAP_ID = "1e9362f45a876eb9";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["places", "routes"];

export const MapComponent: React.FC<MapProps> = ({ autonomie, temps_recharge }) => {
    const centre = { lat: 45.644240631930096, lng: 5.87350120501348 }; // Université Savoie Mont Blanc (Campus Bourget-du-Lac)

    const [originAutocomplete, setOriginAutoComplete] = useState<google.maps.places.Autocomplete>();
    const [destinationAutocomplete, setDestinationAutocomplete] = useState<google.maps.places.Autocomplete>();

    const originRef = useRef<HTMLInputElement>(null);
    const destinationRef = useRef<HTMLInputElement>(null);

    const [origin, setOrigin] = useState<string>("");
    const [destination, setDestination] = useState<string>("");

    const [directionResult, setDirectionResult] = useState<google.maps.DirectionsResult | null>(null);

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const [requestOngoing, setRequestOngoing] = useState<boolean>(false);
    const [trajetContenu, setTrajetContenu] = useState<TrajetContent | null>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        mapIds: [GOOGLE_MAPS_MAP_ID],
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    useEffect(() => {
        if (!originAutocomplete || !destinationAutocomplete) return;

        originAutocomplete.addListener("place_changed", () => {
            const place = originAutocomplete.getPlace();
            const addr = place.formatted_address || "";
            setOrigin(addr);

            if (addr !== "") {
                panToAddress(addr);
            }
        });

        destinationAutocomplete.addListener("place_changed", () => {
            const place = destinationAutocomplete.getPlace();
            const addr = place.formatted_address || "";
            setDestination(addr);

            if (addr !== "") {
                panToAddress(addr);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [originAutocomplete, destinationAutocomplete]);

    if (!isLoaded) {
        return <Spinner />;
    }

    /* 
        <tns:floatArray>
            <tns:float>2.721676</tns:float>
            <tns:float>48.264407</tns:float>
        </tns:floatArray>
        <tns:floatArray>
            <tns:float>2.720788</tns:float>
            <tns:float>48.263874</tns:float>
        </tns:floatArray>
        <tns:floatArray>
            <tns:float>2.721676</tns:float>
            <tns:float>48.264407</tns:float>
        </tns:floatArray>
    */
    function readArrayFloatArray(data: string): [number, number][] {
        const res: [number, number][] = [];
        const count = countXmlValue(data, "tns:floatArray");
        let substr = data.substring(0);
        for (let i = 0; i < count; i++) {
            let floatArray = getXmlValue(substr, "tns:floatArray");
            if (floatArray) {
                const origLength = floatArray.length;
                const lonStr = getXmlValue(floatArray, "tns:float");
                const latStr = getXmlValue(floatArray.substring(floatArray.indexOf("</tns:float>") + 12), "tns:float");
                if (lonStr && latStr) {
                    res.push([parseFloat(lonStr), parseFloat(latStr)]);
                }
                substr = substr.substring(origLength);
            }
        }

        return res;
    }

    function getXmlValue(data: string, nodeName: string): string | null {
        const length = nodeName.length + 2;
        const start = data.indexOf(`<${nodeName}>`) + length;
        if (start < length) {
            return null;
        }

        const end = data.indexOf(`</${nodeName}>`, start);

        return data.substring(start, end);
    }

    function countXmlValue(data: string, nodeName: string): number {
        const length = nodeName.length + 2;
        let count = 0;
        let index = 0;

        while (true) {
            index = data.indexOf(`<${nodeName}>`, index);
            if (index === -1) {
                break;
            }

            count++;
            index += length;
        }

        return count;
    }

    async function CalculTempsTrajet(
        start_lat: number,
        start_long: number,
        end_lat: number,
        end_long: number,
        autonomie: number,
        temps_recharge: number,
    ): Promise<TrajetContent | null> {
        const url = "http://localhost:22220"; // Replace with your SOAP server URL
        const soapBody = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:inf="info802.tp.soap.trajet">
               <soapenv:Header/>
               <soapenv:Body>
               <inf:CalculTemps>
                    <inf:start_long>${start_long}</inf:start_long>
                    <inf:end_long>${end_long}</inf:end_long>
                    <inf:start_lat>${start_lat}</inf:start_lat>
                    <inf:end_lat>${end_lat}</inf:end_lat>
                    <inf:autonomie>${autonomie}</inf:autonomie>
                    <inf:temps_recharge>${temps_recharge}</inf:temps_recharge>
                </inf:CalculTemps>
               </soapenv:Body>
            </soapenv:Envelope>`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "text/xml; charset=utf-8",
                    SOAPAction: "info802.tp.soap.trajet/CalculTemps",
                },
                body: soapBody,
            });

            const responseText = await response.text();

            console.log(responseText);

            const tempsTrajetStr = getXmlValue(responseText, "tns:TotalTemps");
            const bornesStr = getXmlValue(responseText, "tns:BornesRecharge");

            if (bornesStr && tempsTrajetStr) {
                const tempsTrajet = parseFloat(tempsTrajetStr);
                const bornes = readArrayFloatArray(bornesStr);

                console.log("Temps trajet:", tempsTrajet);
                console.log("Bornes:", bornes);

                const content: TrajetContent = { temps_trajet: tempsTrajet, bornes };
                setTrajetContenu(content);

                console.log(content);

                return content;
            }
        } catch (error) {
            console.error(error);
        }

        return null;
    }

    async function updateDirection() {
        if (origin === "" || destination === "") return;

        setRequestOngoing(true);

        const service = new google.maps.DirectionsService();
        const request: google.maps.DirectionsRequest = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        };

        console.log(request);

        const results = await service.route(request);
        setDirectionResult(results);

        const start: google.maps.LatLng = results.routes[0].legs[0].start_location;
        const end: google.maps.LatLng = results.routes[0].legs[0].end_location;

        CalculTempsTrajet(start.lat(), start.lng(), end.lat(), end.lng(), autonomie, temps_recharge);

        setRequestOngoing(false);
    }

    async function panToAddress(address: string) {
        if (map === null) return;

        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ address: address });

        if (result.results.length === 0) return;

        const location = result.results[0].geometry.location;
        map.panTo(location);

        return location;
    }

    return (
        <div style={{ height: "80vh", width: "60vw" }} className="mx-auto p-24">
            <form className="flex max-w-md flex-col gap-4 mx-auto">
                <div>
                    <h1 className="text-xl text-center">
                        Autonomie: <strong>{autonomie / 1000}km</strong>
                    </h1>
                    <h1 className="text-xl text-center">
                        Temps de recharge: <strong>~{temps_recharge}min</strong>
                    </h1>
                </div>
                <Autocomplete onLoad={(autocomplete) => setOriginAutoComplete(autocomplete)}>
                    <TextInput
                        id="dest1"
                        type="text"
                        placeholder="Départ"
                        required
                        onChange={(event) => {
                            setOrigin(event.target.value);
                        }}
                        ref={originRef}
                    />
                </Autocomplete>
                <Autocomplete onLoad={(autocomplete) => setDestinationAutocomplete(autocomplete)}>
                    <TextInput
                        id="dest2"
                        type="text"
                        placeholder="Destination"
                        required
                        onChange={(event) => {
                            setDestination(event.target.value);
                        }}
                        ref={destinationRef}
                    />
                </Autocomplete>
            </form>
            <div className="my-4 border-black border-2 w-full h-full">
                <GoogleMap
                    center={centre}
                    zoom={16}
                    mapContainerStyle={{ height: "100%", width: "100%" }}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                    onLoad={(map) => setMap(map)}
                >
                    <Button
                        onClick={() => {
                            updateDirection();
                            panToAddress(origin);
                        }}
                        className="w-1/2 mx-auto my-4"
                        color="green"
                        disabled={requestOngoing}
                    >
                        Calculer itinéraire
                    </Button>
                    {directionResult && <DirectionsRenderer directions={directionResult} />}
                    {trajetContenu &&
                        trajetContenu.bornes.map((borne, idx) => {
                            return <Marker key={idx} position={new google.maps.LatLng(borne[1], borne[0])} />;
                        })}
                </GoogleMap>
            </div>
        </div>
    );
};
